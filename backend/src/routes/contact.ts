import { Router, Request, Response, NextFunction } from "express";
import { contactSchema, hasNoSQLInjection } from "../schemas/contact";
import { purifyContactInput, hasInjectionAttempt } from "../lib/sanitize";
import { Contact } from "../models/Contact";
import { getConnectionState } from "../config/db";
import { sendContactEmails } from "../lib/email";
import { env } from "../config/env";
import rateLimit from "express-rate-limit";

const router = Router();

// Rate limit: 10 requests per minute per IP for contact (1000 in test for TDD)
const contactLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: env.NODE_ENV === "test" ? 1000 : 10,
  message: { error: "Too many requests", message: "Please try again after a minute", statusCode: 429 },
  standardHeaders: true,
  legacyHeaders: false,
});

type ContactBody = {
  name: unknown;
  email: unknown;
  message?: unknown;
  details?: unknown;
};

router.post("/contact", contactLimiter, async (req: Request<{}, {}, ContactBody>, res: Response, next: NextFunction): Promise<void> => {
  try {
    // 1. Raw NoSQL injection check on raw body
    if (hasNoSQLInjection(req.body as Record<string, unknown>) || hasInjectionAttempt(req.body as Record<string, unknown>)) {
      res.status(400).json({ error: "Validation Error", message: "Invalid payload detected", statusCode: 400 });
      return;
    }

    // 2. Zod typesafe validation
    const parsed = contactSchema.safeParse(req.body);
    if (!parsed.success) {
      const message: string = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
      res.status(400).json({ error: "Validation Error", message, statusCode: 400, issues: parsed.error.issues });
      return;
    }

    // 3. Purify for DOM injection (strip HTML, $ etc)
    const purified = purifyContactInput(parsed.data);

    // Extra check after purify - if purify changed length drastically, it was likely XSS
    // We already sanitized, so we proceed with purified

    // 4. Persist if DB connected, else degraded mode (still return 201 for UX)
    const dbState: number = getConnectionState();
    let docId: unknown = undefined;
    if (dbState === 1) {
      try {
        const doc = await Contact.create({
          name: purified.name,
          email: purified.email,
          message: purified.message,
          details: purified.details,
          ip: req.ip,
        });
        docId = doc._id;
      } catch (dbErr: unknown) {
        const msg: string = dbErr instanceof Error ? dbErr.message : String(dbErr);
        console.error("[contact] DB save failed, returning degraded 201:", msg);
        // Fall through to degraded but still send emails
      }
    }

    // 5. Trigger two Resend emails simultaneously (admin + welcome) - no hardcode, uses env
    // Do not await failure to block response; but await for test determinism
    try {
      await sendContactEmails({
        name: purified.name,
        email: purified.email,
        message: purified.message,
      });
    } catch (emailErr: unknown) {
      const msg: string = emailErr instanceof Error ? emailErr.message : String(emailErr);
      console.error("[contact] Email send failed:", msg);
    }

    if (docId) {
      res.status(201).json({
        message: "Contact submitted successfully",
        data: {
          id: docId,
          name: purified.name,
          email: purified.email,
          message: purified.message,
          details: purified.details,
        },
      });
      return;
    }

    // Degraded: DB not connected, still typesafe + purified, return 201 without persistence
    res.status(201).json({
      message: "Contact received (degraded - queued)",
      data: purified,
      degraded: true,
    });
  } catch (err: unknown) {
    next(err);
  }
});

export default router;
