import { connectDB, disconnectDB } from "../src/config/db";
import { Discovery } from "../src/models/Discovery";
import { getScheduledEvent, extractUuidFromUri, isApiCalendlyUrl } from "../src/services/calendly.service";

const API_MEETING_URL_PATTERN = /^https:\/\/api\.calendly\.com\/scheduled_events\//;

/**
 * One-off data repair: every Discovery whose meetingUrl is a Calendly REST API
 * URI (https://api.calendly.com/scheduled_events/{uuid}) gets rewritten to the
 * human-clickable scheduling_url fetched from the Calendly API.
 *
 * Usage:
 *   cd backend
 *   CALENDLY_API_TOKEN=<your PAT> npm run backfill:meeting-urls
 *
 * Requires a reachable MONGODB_URI (reads + writes the shenodev database).
 */
async function main(): Promise<void> {
  const token: string | undefined = process.env.CALENDLY_API_TOKEN?.trim();
  if (!token) {
    console.error("[backfill] CALENDLY_API_TOKEN is required to resolve scheduling links");
    process.exit(1);
  }

  await connectDB();
  try {
    const cursor = Discovery.find({ meetingUrl: { $regex: API_MEETING_URL_PATTERN } }).cursor();
    let updated = 0;
    let unresolved = 0;
    for await (const doc of cursor) {
      const current: string = doc.meetingUrl ?? "";
      if (!isApiCalendlyUrl(current)) continue;
      const uuid: string | null = extractUuidFromUri(current);
      if (!uuid) {
        unresolved++;
        console.warn(`[backfill] Cannot extract uuid from ${current}`);
        continue;
      }
      const event = await getScheduledEvent(uuid, token);
      const humanLink: string = event?.scheduling_url ?? "";
      if (humanLink) {
        doc.meetingUrl = humanLink;
        await doc.save();
        updated++;
        console.log(`[backfill] ${uuid}: ${current} -> ${humanLink}`);
      } else {
        unresolved++;
        console.warn(`[backfill] No scheduling_url found for ${uuid}`);
      }
    }
    console.log(`[backfill] Done. Updated ${updated}, unresolved ${unresolved}.`);
  } finally {
    await disconnectDB();
  }
}

main().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`[backfill] Failed: ${msg}`);
  process.exit(1);
});