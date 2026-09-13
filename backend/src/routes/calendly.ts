import { Router, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { env } from "../config/env";
import { verifyCalendlySignature, getSigningKey } from "../lib/calendlyWebhook";
import { getScheduledEvent, extractUuidFromUri, formatMeetingLocal, pickSchedulingUrl } from "../lib/calendly";
import { ScheduledMeeting } from "../models/ScheduledMeeting";
import { Discovery } from "../models/Discovery";
import { getConnectionState } from "../config/db";

const router = Router();

// Generous limit - Calendly can burst + retry with backoff
const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: env.NODE_ENV === "test" ? 10000 : 120,
  message: { error: "Too Many Requests", message: "Calendly webhook rate limited", statusCode: 429 },
  standardHeaders: true,
  legacyHeaders: false,
});

interface CalendlyWebhookEnvelope {
  event?: string;
  created_at?: string;
  created_by?: string;
  retry_count?: number;
  payload?: Record<string, unknown>;
}

const asString = (v: unknown): string => (typeof v === "string" ? v : "");
const asRecord = (v: unknown): Record<string, unknown> => (v && typeof v === "object" ? (v as Record<string, unknown>) : {});
const asValidDate = (v: unknown): Date | null => {
  const s = asString(v);
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
};

const handleInviteeCreated = async (payload: Record<string, unknown>): Promise<void> => {
  const invitee: Record<string, unknown> = asRecord(payload.invitee);
  const scheduledEvent: Record<string, unknown> = asRecord(payload.scheduled_event);

  const inviteeUri: string = asString(payload.uri) || asString(invitee.uri);
  const email: string = (asString(payload.email) || asString(invitee.email) || "").trim().toLowerCase();
  const rawEventUri: string = asString(payload.event) || asString(scheduledEvent.uri) || "";
  const eventUuid: string = extractUuidFromUri(rawEventUri) ?? "";
  const timezone: string = asString(payload.timezone) || asString(invitee.timezone) || "";

  let eventName: string = asString(scheduledEvent.name) || asString(payload.event_name) || "";
  let startTime: string = asString(scheduledEvent.start_time) || asString(payload.start_time) || "";
  let endTime: string = asString(scheduledEvent.end_time) || asString(payload.end_time) || "";
  let schedulingUrl: string = pickSchedulingUrl(payload);
  let meetingLink: string = "";

  // Fetch authoritative data from the Calendly API: start/end time and name, plus
  // the actual Google Meet link (resource.location.join_url when location.type is
  // "google_conference"). Fetching whenever we have the event URI means the
  // confirmation email can carry the real join link - never the raw API URI.
  if (rawEventUri) {
    const se = await getScheduledEvent(rawEventUri);
    if (se) {
      startTime = startTime || se.start_time;
      endTime = endTime || se.end_time;
      eventName = eventName || se.name;
      schedulingUrl = schedulingUrl || se.scheduling_url || "";
      const loc = se.location;
      if (loc && loc.type === "google_conference" && loc.join_url) {
        meetingLink = loc.join_url;
      }
    }
  }

  if (!email || !inviteeUri) {
    console.warn("[calendly] invitee.created ignored - missing invitee uri or email");
    return;
  }

  const dbState: number = getConnectionState();
  let recordId: unknown = undefined;
  if (dbState === 1) {
    try {
      const doc = await ScheduledMeeting.findOneAndUpdate(
        { inviteeUri },
        {
          $set: {
            email,
            eventUri: rawEventUri,
            eventUuid,
            inviteeUuid: extractUuidFromUri(inviteeUri) ?? "",
            eventName,
            startTime: asValidDate(startTime) ?? undefined,
            endTime: asValidDate(endTime) ?? undefined,
            timezone,
            status: "scheduled",
            schedulingUrl: schedulingUrl || undefined,
            ...(meetingLink ? { meetingLink } : {}),
            rescheduleUrl: asString(payload.reschedule_url) || asString(invitee.reschedule_url),
            cancelUrl: asString(payload.cancel_url) || asString(invitee.cancel_url),
          },
          $unset: { discoveryId: 1 },
        },
        { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
      );
      recordId = doc._id;
      console.log(`[calendly] Stored scheduled meeting for ${email}: ${eventName || eventUuid || inviteeUri}`);
    } catch (err: unknown) {
      const msg: string = err instanceof Error ? err.message : String(err);
      console.error("[calendly] Failed to persist scheduled meeting (degraded):", msg);
    }

    // Backfill an already-submitted discovery (same email) with authoritative meeting data.
    // NOTE: No email is sent here - the client auto-submit triggers discovery emails.
    try {
      const disc = await Discovery.findOne({ email }).sort({ createdAt: -1 });
      if (disc) {
        let shouldSave = false;
        if (startTime) {
          const local = formatMeetingLocal(startTime, timezone);
          if (local) {
            disc.meetingDate = local.meetingDate;
            disc.meetingTime = local.meetingTime;
            shouldSave = true;
          }
        }
        disc.calendlyEventUri = disc.calendlyEventUri || rawEventUri;
        disc.calendlyEventUrl = disc.calendlyEventUrl || inviteeUri;
        // Only a human-clickable link may become the meeting link - Google Meet join_url,
        // then the calendly.com page, never the invitee/event API URI.
        disc.meetingUrl = disc.meetingUrl || meetingLink || schedulingUrl || "";
        shouldSave = shouldSave || disc.isModified();
        if (shouldSave) await disc.save();
        if (recordId) {
          await ScheduledMeeting.updateOne({ _id: recordId }, { $set: { discoveryId: disc._id } });
          console.log(`[calendly] Linked scheduled meeting to discovery ${String(disc._id)}`);
        }
      }
    } catch (err: unknown) {
      const msg: string = err instanceof Error ? err.message : String(err);
      console.error("[calendly] Failed to backfill discovery meeting fields:", msg);
    }
  }
};

const handleInviteeCanceled = async (payload: Record<string, unknown>): Promise<void> => {
  const invitee: Record<string, unknown> = asRecord(payload.invitee);
  const inviteeUri: string = asString(payload.uri) || asString(invitee.uri);
  const email: string = (asString(payload.email) || asString(invitee.email) || "").trim().toLowerCase();
  if (!inviteeUri) {
    console.warn("[calendly] invitee.canceled ignored - missing invitee uri");
    return;
  }
  const dbState: number = getConnectionState();
  if (dbState === 1) {
    try {
      const result = await ScheduledMeeting.updateOne({ inviteeUri }, { $set: { status: "canceled" } });
      if (result.matchedCount === 0) {
        console.warn(`[calendly] invitee.canceled for unknown invitee ${inviteeUri}`);
        return;
      }
      console.log(`[calendly] Marked meeting canceled for ${email || inviteeUri}`);
    } catch (err: unknown) {
      const msg: string = err instanceof Error ? err.message : String(err);
      console.error("[calendly] Failed to mark meeting canceled (degraded):", msg);
    }
  }
};

router.post("/webhook", webhookLimiter, async (req: Request, res: Response): Promise<void> => {
  // express.raw() is mounted in app.ts BEFORE the global JSON parser so req.body is the raw Buffer
  const rawBody: Buffer = Buffer.isBuffer(req.body) ? req.body : Buffer.from("");
  const signingKey: string | undefined = getSigningKey();

  if (!signingKey) {
    console.warn("[calendly] CALENDLY_WEBHOOK_SIGNING_KEY not set - rejecting webhook (503)");
    res.status(503).json({ error: "Calendly webhook not configured", statusCode: 503 });
    return;
  }

  const headerValue: string | string[] | undefined = req.headers["calendly-webhook-signature"] ?? req.headers["x-calendly-webhook-signature"];
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
});

export default router;