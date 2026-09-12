import { Router, Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import multer from "multer";
import { discoverySchema, hasNoSQLInjectionDiscovery } from "../schemas/discovery";
import { purifyString, hasInjectionAttempt } from "../lib/sanitize";
import { Discovery } from "../models/Discovery";
import { getConnectionState } from "../config/db";
import { sendDiscoveryEmails } from "../lib/email";
import { uploadToCloudinary } from "../config/cloudinary";
import { env } from "../config/env";

const router = Router();

const discoveryLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: env.NODE_ENV === "test" ? 1000 : 10,
  message: { error: "Too many requests", message: "Please try again after a minute", statusCode: 429 },
  standardHeaders: true,
  legacyHeaders: false,
});

// Multer for file attachments (ephemeral FS safe, Cloudinary) - supports any file field (attachment, file)
const uploadDiscovery = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "application/pdf",
      "application/zip",
      "application/x-zip-compressed",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (allowed.includes(file.mimetype) || file.mimetype.startsWith("image/") || file.mimetype === "application/octet-stream") {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file type for discovery attachment"));
    }
  },
});

type DiscoveryBody = Record<string, unknown>;

router.post(
  "/discovery",
  discoveryLimiter,
  uploadDiscovery.single("attachment"),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Handle file attachment via Cloudinary if present (field "attachment" - fallback to "file" via multer)
    let attachmentUrl: string | null = null;
    let attachmentPublicId: string | null = null;
    const file = (req as unknown as { file?: Express.Multer.File }).file;
    if (file) {
      try {
        const result = await uploadToCloudinary(file.buffer, {
          folder: "shenodev_discovery",
          resourceType: "auto",
        });
        attachmentUrl = result.secure_url;
        attachmentPublicId = result.public_id;
        console.log(`[discovery] Uploaded attachment to Cloudinary: ${attachmentUrl}`);
      } catch (cloudErr: unknown) {
        const msg: string = cloudErr instanceof Error ? cloudErr.message : String(cloudErr);
        console.error("[discovery] Cloudinary upload failed for attachment:", msg);
        res.status(500).json({ error: "Upload Error", message: "Failed to upload attachment to Cloudinary", statusCode: 500 });
        return;
      }
    }

    // Merge attachment URL into body for validation/persistence
    const bodyWithAttachment: Record<string, unknown> = {
      ...req.body,
      ...(attachmentUrl ? { attachmentUrl, attachmentPublicId } : {}),
    };

    // 1. Raw injection check
    if (hasNoSQLInjectionDiscovery(bodyWithAttachment as Record<string, unknown>) || hasInjectionAttempt(bodyWithAttachment as Record<string, unknown>)) {
      res.status(400).json({ error: "Validation Error", message: "Invalid payload detected", statusCode: 400 });
      return;
    }

    // 2. Zod validation (typesafe)
    const parsed = discoverySchema.safeParse(bodyWithAttachment);
    if (!parsed.success) {
      const message: string = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
      res.status(400).json({ error: "Validation Error", message, statusCode: 400, issues: parsed.error.issues });
      return;
    }

    // 3. Purify all string fields for DOM injection
    const raw = parsed.data;
    const purified = {
      fullName: purifyString(raw.fullName),
      companyName: purifyString(raw.companyName),
      email: purifyString(raw.email).toLowerCase(),
      phone: purifyString(raw.phone ?? ""),
      businessDesc: purifyString(raw.businessDesc),
      targetAudience: purifyString(raw.targetAudience ?? ""),
      competitors: purifyString(raw.competitors ?? ""),
      brandStatus: raw.brandStatus,
      references: purifyString(raw.references ?? ""),
      dislikes: purifyString(raw.dislikes ?? ""),
      targetPackage: raw.targetPackage,
      requiredFeatures: purifyString(raw.requiredFeatures ?? ""),
      integrations: purifyString(raw.integrations ?? ""),
      launchDate: (raw.launchDate ?? "").trim(),
      extraDetails: purifyString(raw.extraDetails ?? ""),
      meetingDate: purifyString((raw as Record<string, string>).meetingDate ?? ""),
      meetingTime: purifyString((raw as Record<string, string>).meetingTime ?? ""),
      meetingUrl: purifyString((raw as Record<string, string>).meetingUrl ?? ""),
      calendlyEventUri: purifyString((raw as Record<string, string>).calendlyEventUri ?? ""),
      calendlyEventUrl: purifyString((raw as Record<string, string>).calendlyEventUrl ?? ""),
      attachmentUrl: attachmentUrl ? purifyString(attachmentUrl) : purifyString((raw as Record<string, string>).attachmentUrl ?? ""),
      attachmentPublicId: attachmentPublicId ? purifyString(attachmentPublicId) : purifyString((raw as Record<string, string>).attachmentPublicId ?? ""),
    };

    // Extra injection check after purify
    const injectionPattern = /\$where|__proto__|\$gt|\$ne/;
    if (injectionPattern.test(purified.businessDesc) || injectionPattern.test(purified.competitors)) {
      res.status(400).json({ error: "Validation Error", message: "Invalid content detected", statusCode: 400 });
      return;
    }

    // 4. Save to MongoDB if connected
    const dbState: number = getConnectionState();
    let docId: unknown = undefined;
    if (dbState === 1) {
      try {
        const doc = await Discovery.create({ ...purified, ip: req.ip });
        docId = doc._id;
      } catch (dbErr: unknown) {
        const msg: string = dbErr instanceof Error ? dbErr.message : String(dbErr);
        console.error("[discovery] DB save failed, degraded:", msg);
      }
    }

    // 5. Send two emails simultaneously via Resend
    try {
      await sendDiscoveryEmails(purified);
    } catch (emailErr: unknown) {
      const msg: string = emailErr instanceof Error ? emailErr.message : String(emailErr);
      console.error("[discovery] Email send failed:", msg);
    }

    if (docId) {
      res.status(201).json({
        message: "Discovery submitted successfully",
        data: { id: docId, ...purified },
      });
      return;
    }

    res.status(201).json({
      message: "Discovery received (degraded - queued)",
      data: purified,
      degraded: true,
    });
  } catch (err: unknown) {
    next(err);
  }
});

export default router;
