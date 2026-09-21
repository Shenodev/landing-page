import { ScheduledMeeting } from "../models/ScheduledMeeting";
import { Discovery } from "../models/Discovery";
import { getConnectionState } from "../config/db";
import { maskEmail } from "../lib/security";
import { getScheduledEvent, extractUuidFromUri, formatMeetingLocal, pickSchedulingUrl } from "./calendly.service";

const asString = (v: unknown): string => (typeof v === "string" ? v : "");
const asRecord = (v: unknown): Record<string, unknown> => (v && typeof v === "object" ? (v as Record<string, unknown>) : {});
const asValidDate = (v: unknown): Date | null => {
  const s: string = asString(v);
  if (!s) return null;
  const d: Date = new Date(s);
  return isNaN(d.getTime()) ? null : d;
};

/**
 * Process invitee.created: persist the scheduled meeting, resolve the Google Meet
 * join_url from the Calendly API, and backfill any matching Discovery document.
 * Never sends email — the confirmation email is triggered only when the discovery
 * form submission arrives via POST /api/discovery.
 */
export const handleInviteeCreated = async (payload: Record<string, unknown>): Promise<void> => {
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

  // Fetch authoritative data from the Calendly API
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
      console.log(`[calendly] Stored scheduled meeting for ${maskEmail(email)}: ${eventName || eventUuid || inviteeUri}`);
    } catch (err: unknown) {
      const msg: string = err instanceof Error ? err.message : String(err);
      console.error("[calendly] Failed to persist scheduled meeting (degraded):", msg);
    }

    // Backfill an already-submitted discovery (same email) with authoritative meeting data.
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

/**
 * Process invitee.canceled: mark the matching ScheduledMeeting as canceled.
 */
export const handleInviteeCanceled = async (payload: Record<string, unknown>): Promise<void> => {
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
      console.log(`[calendly] Marked meeting canceled for ${email ? maskEmail(email) : inviteeUri}`);
    } catch (err: unknown) {
      const msg: string = err instanceof Error ? err.message : String(err);
      console.error("[calendly] Failed to mark meeting canceled (degraded):", msg);
    }
  }
};