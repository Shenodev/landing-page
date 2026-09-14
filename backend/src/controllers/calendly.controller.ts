import { Request, Response } from "express";
import { CalendlyWebhookEnvelope } from "../dto/calendly";
import { handleInviteeCreated, handleInviteeCanceled } from "../services/calendlyEvents.service";
import {
  CALENDLY_SIGNATURE_HEADER,
  CALENDLY_SIGNATURE_HEADER_ALT,
  getSigningKey,
  verifyCalendlySignature,
} from "../services/calendlyWebhook.service";

/**
 * Calendly webhook endpoint.
 *
 * The raw body Buffer arrives because app.ts mounts express.raw() on this path
 * BEFORE the global JSON parser - HMAC verification requires the exact bytes.
 * Always acknowledges with 2xx so Calendly stops retrying, even on processing
 * failures (logged separately).
 */
export const postCalendlyWebhook = async (req: Request, res: Response): Promise<void> => {
  // express.raw() is mounted in app.ts BEFORE the global JSON parser so req.body is the raw Buffer
  const rawBody: Buffer = Buffer.isBuffer(req.body) ? req.body : Buffer.from("");
  const signingKey: string | undefined = getSigningKey();

  if (!signingKey) {
    console.warn("[calendly] CALENDLY_WEBHOOK_SIGNING_KEY not set - rejecting webhook (503)");
    res.status(503).json({ error: "Calendly webhook not configured", statusCode: 503 });
    return;
  }

  const headerValue: string | string[] | undefined = req.headers[CALENDLY_SIGNATURE_HEADER] ?? req.headers[CALENDLY_SIGNATURE_HEADER_ALT];
  const header: string | undefined = typeof headerValue === "string" ? headerValue : Array.isArray(headerValue) ? headerValue[0] : undefined;

  if (!verifyCalendlySignature(rawBody, header, signingKey)) {
    console.warn("[calendly] Invalid webhook signature - rejecting (401)");
    res.status(401).json({ error: "Invalid signature", statusCode: 401 });
    return;
  }

  let envelope: CalendlyWebhookEnvelope;
  try {
    envelope = JSON.parse(rawBody.toString("utf8")) as CalendlyWebhookEnvelope;
  } catch {
    res.status(400).json({ error: "Invalid JSON payload", statusCode: 400 });
    return;
  }

  const { event, payload } = envelope;
  try {
    if (event === "invitee.created") {
      await handleInviteeCreated(payload ?? {});
    } else if (event === "invitee.canceled") {
      await handleInviteeCanceled(payload ?? {});
    } else {
      console.log(`[calendly] Ignoring unhandled webhook event: ${event ?? "unknown"}`);
    }
  } catch (err: unknown) {
    const msg: string = err instanceof Error ? err.message : String(err);
    console.error("[calendly] Webhook processing failed:", msg);
  }

  // Always acknowledge with 2xx so Calendly stops retrying
  res.status(200).json({ received: true });
};