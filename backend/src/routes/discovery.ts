import { Router, Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import { discoverySchema, hasNoSQLInjectionDiscovery } from "../schemas/discovery";
import { purifyString, hasInjectionAttempt } from "../lib/sanitize";
import { Discovery } from "../models/Discovery";
import { getConnectionState } from "../config/db";
import { sendDiscoveryEmails } from "../lib/email";
import { env } from "../config/env";

const router = Router();

const discoveryLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: env.NODE_ENV === "test" ? 1000 : 10,
  message: { error: "Too many requests", message: "Please try again after a minute", statusCode: 429 },
  standardHeaders: true,
  legacyHeaders: false,
});

type DiscoveryBody = Record<string, unknown>;

router.post("/discovery", discoveryLimiter, async (req: Request<{}, {}, DiscoveryBody>, res: Response, next: NextFunction): Promise<void> => {
  try {
    // 1. Raw injection check
    if (hasNoSQLInjectionDiscovery(req.body as Record<string, unknown>) || hasInjectionAttempt(req.body as Record<string, unknown>)) {
      res.status(400).json({ error: "Validation Error", message: "Invalid payload detected", statusCode: 400 });
      return;
    }

    // 2. Zod validation (typesafe)
    const parsed = discoverySchema.safeParse(req.body);
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
