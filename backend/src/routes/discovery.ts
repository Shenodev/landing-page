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
import { getScheduledEvent, extractUuidFromUri, formatMeetingLocal, isApiCalendlyUrl } from "../lib/calendly";
import { ScheduledMeeting, IScheduledMeeting } from "../models/ScheduledMeeting";

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
    if (allowed.includes(file.mimetype) || file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file type for discovery attachment"));
    }
  },
});

type DiscoveryBody = Record<string, unknown>;

type PurifiedDiscovery = {
  fullName: string;
  companyName: string;
  email: string;
  phone: string;
  businessDesc: string;
  targetAudience: string;
  competitors: string;
  brandStatus: string;
  references: string;
  dislikes: string;
  targetPackage: string;
  requiredFeatures: string;
  integrations: string;
  launchDate: string;
  extraDetails: string;
  meetingDate: string;
  meetingTime: string;
  meetingUrl: string;
  calendlyEventUri: string;
  calendlyEventUrl: string;
  attachmentUrl: string;
  attachmentPublicId: string;
  attachments?: Array<{ url: string; publicId: string; fileName: string; mimeType: string; size: number }>;
};

/**
 * Replace the client-captured meeting fields with AUTHORITATIVE data from Calendly:
 * 1. Prefer a `ScheduledMeeting` persisted by the webhook (has invitee timezone).
 * 2. Fall back to the Calendly API (GET /scheduled_events/{uuid}) via the token.
 * Client-side `new Date()` values are unreliable (they capture the callback moment,
 * not the actual booking time) - this overwrites them so emails carry the true time.
 */
const enrichDiscoveryMeeting = async (
  data: PurifiedDiscovery
): Promise<{ enriched: PurifiedDiscovery; scheduledId: unknown }> => {
  const enriched: PurifiedDiscovery = { ...data };
  let scheduledId: unknown = undefined;
  let merged: IScheduledMeeting | null = null;

  if (getConnectionState() === 1 && enriched.email) {
    try {
      const email: string = enriched.email.toLowerCase();
      let candidate: IScheduledMeeting | null = await ScheduledMeeting.findOne({ email, status: "scheduled" })
        .sort({ createdAt: -1 })
        .exec();
      const eventUuid: string | null = extractUuidFromUri(enriched.calendlyEventUri);
      if (candidate && eventUuid && candidate.eventUuid && candidate.eventUuid !== eventUuid) {
        const exact: IScheduledMeeting | null = await ScheduledMeeting.findOne({ email, status: "scheduled", eventUuid })
          .sort({ createdAt: -1 })
          .exec();
        if (exact) candidate = exact;
      }
      merged = candidate;
    } catch (err: unknown) {
      const msg: string = err instanceof Error ? err.message : String(err);
      console.error("[discovery] ScheduledMeeting lookup failed (degraded):", msg);
    }
  }

  if (merged?.startTime) {
    const local = formatMeetingLocal(merged.startTime.toISOString(), merged.timezone);
    if (local) {
      enriched.meetingDate = local.meetingDate;
      enriched.meetingTime = local.meetingTime;
    }
    // Google Meet join_url wins over the calendly.com page and the client link,
    // so the confirmation email carries the actual call link (fallback text is
    // applied in the email template when nothing resolves).
    enriched.meetingUrl = merged.meetingLink || enriched.meetingUrl || merged.schedulingUrl || "";
    enriched.calendlyEventUri = enriched.calendlyEventUri || merged.eventUri;
    enriched.calendlyEventUrl = enriched.calendlyEventUrl || merged.inviteeUri;
    scheduledId = merged._id;
    console.log(`[discovery] Merged authoritative meeting from webhook record for ${enriched.email}`);
  } else if (enriched.calendlyEventUri) {
    const se = await getScheduledEvent(enriched.calendlyEventUri);
    if (se?.start_time) {
      const local = formatMeetingLocal(se.start_time, "UTC");
      if (local) {
        enriched.meetingDate = local.meetingDate;
        enriched.meetingTime = local.meetingTime;
      }
      const joinUrl: string = se.location && se.location.type === "google_conference" ? (se.location.join_url ?? "") : "";
      enriched.meetingUrl = joinUrl || enriched.meetingUrl || se.scheduling_url || "";
      console.log(`[discovery] Enriched meeting via Calendly API for ${enriched.email}`);
    }
  }

  return { enriched, scheduledId };
};

router.post(
  "/discovery",
  discoveryLimiter,
  uploadDiscovery.fields([
    { name: "attachments", maxCount: 10 },
    { name: "attachment", maxCount: 1 },
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Handle multiple file attachments via Cloudinary if present
    // Fields: "attachments" (multiple, up to 10) + legacy "attachment" (single)
    // multer.fields() exposes req.files as { [fieldname]: File[] }, so flatten it.
    const uploadedFields = (req as unknown as { files?: Record<string, Express.Multer.File[]> | Express.Multer.File[] }).files;
    const files: Express.Multer.File[] = Array.isArray(uploadedFields) ? uploadedFields : uploadedFields ? Object.values(uploadedFields).flat() : [];
    let attachmentUrl: string | null = null;
    let attachmentPublicId: string | null = null;
    const attachments: Array<{ url: string; publicId: string; fileName: string; mimeType: string; size: number }> = [];
    for (const file of files) {
      try {
        const result = await uploadToCloudinary(file.buffer, {
          folder: "shenodev_discovery",
          resourceType: "auto",
        });
        attachments.push({
          url: result.secure_url,
          publicId: result.public_id,
          fileName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
        });
        if (!attachmentUrl) {
          attachmentUrl = result.secure_url;
          attachmentPublicId = result.public_id;
        }
        console.log(`[discovery] Uploaded attachment to Cloudinary: ${result.secure_url}`);
      } catch (cloudErr: unknown) {
        const msg: string = cloudErr instanceof Error ? cloudErr.message : String(cloudErr);
        console.error("[discovery] Cloudinary upload failed for attachment:", msg);
        res.status(500).json({ error: "Upload Error", message: "Failed to upload attachment to Cloudinary", statusCode: 500 });
        return;
      }
    }

    // Merge attachments into body for validation/persistence
    const bodyWithAttachment: Record<string, unknown> = {
      ...req.body,
      ...(attachmentUrl ? { attachmentUrl, attachmentPublicId } : {}),
      ...(attachments.length ? { attachments } : {}),
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
      meetingDate: purifyString((raw as unknown as Record<string, string>).meetingDate ?? ""),
      meetingTime: purifyString((raw as unknown as Record<string, string>).meetingTime ?? ""),
      meetingUrl: purifyString((raw as unknown as Record<string, string>).meetingUrl ?? ""),
      calendlyEventUri: purifyString((raw as unknown as Record<string, string>).calendlyEventUri ?? ""),
      calendlyEventUrl: purifyString((raw as unknown as Record<string, string>).calendlyEventUrl ?? ""),
      attachmentUrl: attachmentUrl ? purifyString(attachmentUrl) : purifyString((raw as unknown as Record<string, string>).attachmentUrl ?? ""),
      attachmentPublicId: attachmentPublicId ? purifyString(attachmentPublicId) : purifyString((raw as unknown as Record<string, string>).attachmentPublicId ?? ""),
      attachments: attachments.length
        ? attachments.map((a) => ({
            url: purifyString(a.url),
            publicId: purifyString(a.publicId),
            fileName: purifyString(a.fileName),
            mimeType: purifyString(a.mimeType),
            size: a.size,
          }))
        : (raw.attachments ?? []).map((a) => ({
            url: purifyString(a.url),
            publicId: purifyString(a.publicId ?? ""),
            fileName: purifyString(a.fileName ?? ""),
            mimeType: purifyString(a.mimeType ?? ""),
            size: a.size ?? 0,
          })),
    };

    // A Calendly API resource (https://api.calendly.com/...) is an identifier,
    // NOT a human link - it errors with "access token is invalid" in a browser.
    // Keep it only as the URI field; never as the clickable meeting link.
    if (isApiCalendlyUrl(purified.meetingUrl)) {
      purified.calendlyEventUrl = purified.calendlyEventUrl || purified.meetingUrl;
      purified.meetingUrl = "";
    }

    // Extra injection check after purify
    const injectionPattern = /\$where|__proto__|\$gt|\$ne/;
    if (injectionPattern.test(purified.businessDesc) || injectionPattern.test(purified.competitors)) {
      res.status(400).json({ error: "Validation Error", message: "Invalid content detected", statusCode: 400 });
      return;
    }

    // 4. Enrich meeting fields with authoritative Calendly data (webhook record + API)
    const { enriched, scheduledId } = await enrichDiscoveryMeeting(purified);

    // 5. Save to MongoDB if connected
    const dbState: number = getConnectionState();
    let docId: unknown = undefined;
    if (dbState === 1) {
      try {
        const doc = await Discovery.create({ ...enriched, ip: req.ip });
        docId = doc._id;
        if (scheduledId) {
          await ScheduledMeeting.updateOne({ _id: scheduledId }, { $set: { discoveryId: doc._id } }).catch((linkErr: unknown) => {
            const msg: string = linkErr instanceof Error ? linkErr.message : String(linkErr);
            console.error("[discovery] Failed to link ScheduledMeeting -> Discovery:", msg);
          });
        }
      } catch (dbErr: unknown) {
        const msg: string = dbErr instanceof Error ? dbErr.message : String(dbErr);
        console.error("[discovery] DB save failed, degraded:", msg);
      }
    }

    // 6. Send two emails simultaneously via Resend
    // NOTE: Email failure does NOT rollback DB — discovery is still queued for processing.
    // The 201 response is returned to user regardless of email status to avoid UX disruption.
    // Admin/DevOps can monitor email failures via logs and retry via admin panel if needed.
    try {
      await sendDiscoveryEmails(enriched);
    } catch (emailErr: unknown) {
      const msg: string = emailErr instanceof Error ? emailErr.message : String(emailErr);
      console.error("[discovery] Email send failed:", msg);
    }

    if (docId) {
      res.status(201).json({
        message: "Discovery submitted successfully",
        data: { id: docId, ...enriched },
      });
      return;
    }

    res.status(201).json({
      message: "Discovery received (degraded - queued)",
      data: enriched,
      degraded: true,
    });
  } catch (err: unknown) {
    next(err);
  }
});

export default router;
