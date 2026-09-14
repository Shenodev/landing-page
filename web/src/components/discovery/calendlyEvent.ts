import type { EventScheduledEvent } from "react-calendly";

export type MeetingDetails = {
  meetingUrl: string;
  eventUri: string;
  inviteeUri: string;
  meetingDate: string;
  meetingTime: string;
};

type CalendlyMessage = {
  event?: string;
  payload?: {
    event?: { uri?: string; scheduling_url?: string };
    invitee?: { uri?: string; scheduling_url?: string };
  };
};

const formatTime = (date: Date): string =>
  date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export const parseCalendlyMessage = (e: EventScheduledEvent): MeetingDetails | null => {
  const data = e.data as CalendlyMessage | undefined;
  if (!data || data.event !== "calendly.event_scheduled" || !data.payload) {
    return null;
  }

  const origin = typeof e.origin === "string" ? e.origin : "";
  if (origin && !origin.includes("calendly.com")) {
    console.warn("[discovery] Ignoring calendar event from non-Calendly origin:", origin);
    return null;
  }

  const now = new Date();
  return {
    // Human-clickable calendly.com link — never the api.calendly.com resource URI.
    meetingUrl: data.payload.invitee?.scheduling_url || data.payload.event?.scheduling_url || "",
    eventUri: data.payload.event?.uri || "",
    inviteeUri: data.payload.invitee?.uri || "",
    meetingDate: now.toISOString().split("T")[0],
    meetingTime: formatTime(now),
  };
};