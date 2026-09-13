export const CALENDLY_API_BASE = "https://api.calendly.com";

const asString = (v: unknown): string => (typeof v === "string" ? v : "");
const asRecord = (v: unknown): Record<string, unknown> => (v && typeof v === "object" ? (v as Record<string, unknown>) : {});

/**
 * True when a value is a Calendly REST API resource URI.
 * These require Authorization and can never be opened in a browser - they must
 * never be used as the human-facing "meeting link".
 */
export const isApiCalendlyUrl = (value: string): boolean => {
  return value.startsWith(`${CALENDLY_API_BASE}/`);
};

/**
 * Pick the HUMAN-readable scheduling link from a Calendly webhook or embed
 * payload. Priority:
 *  1. invitee.scheduling_url (booking-specific page under calendly.com)
 *  2. event.scheduling_url (embed message with scheduling_url)
 *  3. scheduled_event.scheduling_url (legacy webhook enrichment)
 *  4. top-level payload.scheduling_url (webhook)
 * Returns "" when no human link exists - never the invitee/event API URI.
 */
export const pickSchedulingUrl = (payload: Record<string, unknown>): string => {
  const invitee = asRecord(payload.invitee);
  const event = asRecord(payload.event);
  const scheduledEvent = asRecord(payload.scheduled_event);
  return (
    asString(invitee.scheduling_url) ||
    asString(event.scheduling_url) ||
    asString(scheduledEvent.scheduling_url) ||
    asString(payload.scheduling_url)
  );
};

export interface CalendlyScheduledEvent {
  uri: string;
  name: string;
  status: string;
  start_time: string;
  end_time: string;
  event_type: string;
  scheduling_url?: string;
  location?: { type: string; location?: string } | null;
  event_memberships?: Array<{ user: string }>;
}

export interface CalendlyInvitee {
  uri: string;
  name: string;
  email: string;
  status: string;
  timezone: string;
  cancel_url: string;
  reschedule_url: string;
  created_at: string;
  updated_at: string;
}

/**
 * Resolve the Calendly Personal Access Token.
 * dotenv.config() populates process.env from .env, so process.env is the
 * runtime source (also lets tests seed/clear it per request).
 */
export const getCalendlyToken = (): string | undefined => {
  const token: string | undefined = process.env.CALENDLY_API_TOKEN;
  return token ? token.trim() : undefined;
};

/**
 * Extract the trailing UUID from a Calendly resource URI, e.g.
 * "https://api.calendly.com/scheduled_events/GBGBDCAADAEDCRZ2" -> "GBGBDCAADAEDCRZ2".
 * Returns null when the URI is missing or malformed.
 */
export const extractUuidFromUri = (uri: string | null | undefined): string | null => {
  if (!uri || typeof uri !== "string") return null;
  const parts = uri.split("/").filter(Boolean);
  const last = parts[parts.length - 1];
  if (!last || /[\s<>"']/.test(last)) return null;
  return last;
};

const authHeaders = (token: string): Record<string, string> => ({
  Authorization: `Bearer ${token}`,
  Accept: "application/json",
});

const request = async <T>(path: string, token: string): Promise<T | null> => {
  try {
    const res = await fetch(`${CALENDLY_API_BASE}${path}`, { headers: authHeaders(token), signal: AbortSignal.timeout(8000) });
    if (!res.ok) {
      console.warn(`[calendly] API ${res.status} for ${path}`);
      return null;
    }
    const json = (await res.json()) as { resource?: T };
    return json.resource ?? null;
  } catch (err: unknown) {
    const msg: string = err instanceof Error ? err.message : String(err);
    console.error(`[calendly] API request failed for ${path}: ${msg}`);
    return null;
  }
};

/**
 * Convert a Calendly API resource URI into a request path by stripping the API base,
 * e.g. "https://api.calendly.com/scheduled_events/E1/invitees/I1" -> "/scheduled_events/E1/invitees/I1".
 */
const uriToPath = (uri: string): string | null => {
  if (!uri || !uri.startsWith(CALENDLY_API_BASE)) return null;
  const path = uri.slice(CALENDLY_API_BASE.length);
  return path || null;
};

/**
 * Fetch a scheduled event (authoritative start/end time) from Calendly.
 * Accepts either a full URI or a bare UUID. Returns null in degraded mode.
 */
export const getScheduledEvent = async (uuidOrUri: string, token?: string): Promise<CalendlyScheduledEvent | null> => {
  const apiToken: string | undefined = token ?? getCalendlyToken();
  const uuid: string | null = extractUuidFromUri(uuidOrUri);
  if (!apiToken || !uuid) {
    if (!apiToken) console.warn("[calendly] CALENDLY_API_TOKEN not set - skipping scheduled event fetch");
    return null;
  }
  return request<CalendlyScheduledEvent>(`/scheduled_events/${encodeURIComponent(uuid)}`, apiToken);
};

/**
 * Fetch invitee details by URI, e.g. "https://api.calendly.com/scheduled_events/E1/invitees/I1".
 */
export const getInvitee = async (inviteeUri: string, token?: string): Promise<CalendlyInvitee | null> => {
  const apiToken: string | undefined = token ?? getCalendlyToken();
  const path: string | null = uriToPath(inviteeUri);
  if (!apiToken || !path) {
    return null;
  }
  return request<CalendlyInvitee>(path, apiToken);
};

/**
 * Convert a UTC start_time string into meeting-date + meeting-time strings
 * in the invitee's local timezone. Falls back to UTC when timeZone is missing
 * or invalid. Returns null only when startTime cannot be parsed.
 */
export const formatMeetingLocal = (
  startTime: string | undefined | null,
  timeZone?: string | null
): { meetingDate: string; meetingTime: string } | null => {
  if (!startTime) return null;
  const date = new Date(startTime);
  if (isNaN(date.getTime())) return null;
  try {
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: timeZone || "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
    const parts = fmt.formatToParts(date);
    const get = (t: Intl.DateTimeFormatPartTypes): string => parts.find((p) => p.type === t)?.value ?? "";
    const day: string = get("day");
    const month: string = get("month");
    const year: string = get("year");
    let hour: string = get("hour");
    const minute: string = get("minute");
    if (hour === "24") hour = "00";
    return { meetingDate: `${year}-${month}-${day}`, meetingTime: `${hour}:${minute}` };
  } catch {
    return formatMeetingLocal(startTime, "UTC");
  }
};