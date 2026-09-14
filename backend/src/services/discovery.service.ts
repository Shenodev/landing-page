import { discoverySchema, hasNoSQLInjectionDiscovery } from "../schemas/discovery";
import { purifyString, hasInjectionAttempt } from "../lib/sanitize";
import { Discovery } from "../models/Discovery";
import { ScheduledMeeting, IScheduledMeeting } from "../models/ScheduledMeeting";
import { getConnectionState } from "../config/db";
import { sendDiscoveryEmails } from "./email.service";
import { uploadToCloudinary } from "./cloudinary.service";
import { getScheduledEvent, extractUuidFromUri, formatMeetingLocal, isApiCalendlyUrl } from "./calendly.service";
import { ValidationError, UploadError } from "../errors/http-errors";
import { ErrorIssue } from "../errors/api-error";
import { BrandStatus, TargetPackage, DiscoveryAttachment, PurifiedDiscovery, DiscoveryResult } from "../dto/discovery";

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

/**
 * Validate, purify, enrich, persist and email a discovery form submission.
 *
 * Degraded mode: when the DB is unreachable the request still succeeds (201)
 * and emails still fire. Validation and injection failures throw ValidationError.
 */
export const submitDiscovery = async (
  body: unknown,
  files: Express.Multer.File[],
  ip: string
): Promise<DiscoveryResult> => {
  // Flatten multer.fields() output: { [fieldname]: File[] } or File[] → File[]
  const uploadedFields = (files ?? []) as Express.Multer.File[];
  let attachmentUrl: string | null = null;
  let attachmentPublicId: string | null = null;
  const attachments: DiscoveryAttachment[] = [];

  for (const file of uploadedFields) {
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
      throw new UploadError("Failed to upload attachment to Cloudinary");
    }
  }

  // Merge attachments into body for validation/persistence
  const raw: Record<string, unknown> = (body ?? {}) as Record<string, unknown>;
  const bodyWithAttachment: Record<string, unknown> = {
    ...raw,
    ...(attachmentUrl ? { attachmentUrl, attachmentPublicId } : {}),
    ...(attachments.length ? { attachments } : {}),
  };

  // 1. Raw injection check
  if (hasNoSQLInjectionDiscovery(bodyWithAttachment) || hasInjectionAttempt(bodyWithAttachment)) {
    throw new ValidationError("Invalid payload detected");
  }

  // 2. Zod validation (typesafe)
  const parsed = discoverySchema.safeParse(bodyWithAttachment);
  if (!parsed.success) {
    const message: string = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
    const issues: ErrorIssue[] = parsed.error.issues.map((i) => ({ message: i.message, path: i.path.filter((p): p is string | number => typeof p === "string" || typeof p === "number") }));
    throw new ValidationError(message, issues);
  }

  // 3. Purify all string fields for DOM injection
  const r = parsed.data;
  // Meeting fields from the zod schema are optional strings - cast for field extraction
  const rec = r as unknown as Record<string, string>;
  const purified: PurifiedDiscovery = {
    fullName: purifyString(r.fullName),
    companyName: purifyString(r.companyName),
    email: purifyString(r.email).toLowerCase(),
    phone: purifyString(r.phone ?? ""),
    businessDesc: purifyString(r.businessDesc),
    targetAudience: purifyString(r.targetAudience ?? ""),
    competitors: purifyString(r.competitors ?? ""),
    brandStatus: r.brandStatus as BrandStatus,
    references: purifyString(r.references ?? ""),
    dislikes: purifyString(r.dislikes ?? ""),
    targetPackage: r.targetPackage as TargetPackage,
    requiredFeatures: purifyString(r.requiredFeatures ?? ""),
    integrations: purifyString(r.integrations ?? ""),
    launchDate: (r.launchDate ?? "").trim(),
    extraDetails: purifyString(r.extraDetails ?? ""),
    meetingDate: purifyString(rec.meetingDate ?? ""),
    meetingTime: purifyString(rec.meetingTime ?? ""),
    meetingUrl: purifyString(rec.meetingUrl ?? ""),
    calendlyEventUri: purifyString(rec.calendlyEventUri ?? ""),
    calendlyEventUrl: purifyString(rec.calendlyEventUrl ?? ""),
    attachmentUrl: attachmentUrl ? purifyString(attachmentUrl) : purifyString(rec.attachmentUrl ?? ""),
    attachmentPublicId: attachmentPublicId ? purifyString(attachmentPublicId) : purifyString(rec.attachmentPublicId ?? ""),
    attachments: attachments.length
      ? attachments.map((a) => ({
          url: purifyString(a.url),
          publicId: purifyString(a.publicId),
          fileName: purifyString(a.fileName),
          mimeType: purifyString(a.mimeType),
          size: a.size,
        }))
      : (r.attachments ?? []).map((a) => ({
          url: purifyString(a.url),
          publicId: purifyString(a.publicId ?? ""),
          fileName: purifyString(a.fileName ?? ""),
          mimeType: purifyString(a.mimeType ?? ""),
          size: a.size ?? 0,
        })),
  };

  // A Calendly API resource (https://api.calendly.com/...) is an identifier,
  // NOT a human link - it errors with "access token is invalid" in a browser.
  if (isApiCalendlyUrl(purified.meetingUrl)) {
    purified.calendlyEventUrl = purified.calendlyEventUrl || purified.meetingUrl;
    purified.meetingUrl = "";
  }

  // Extra injection check after purify
  const injectionPattern = /\$where|__proto__|\$gt|\$ne/;
  if (injectionPattern.test(purified.businessDesc) || injectionPattern.test(purified.competitors)) {
    throw new ValidationError("Invalid content detected");
  }

  // 4. Enrich meeting fields with authoritative Calendly data (webhook record + API)
  const { enriched, scheduledId } = await enrichDiscoveryMeeting(purified);

  // 5. Save to MongoDB if connected
  const dbState: number = getConnectionState();
  let docId: unknown = undefined;
  if (dbState === 1) {
    try {
      const doc = await Discovery.create({ ...enriched, ip });
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

  // 6. Send two emails simultaneously via Resend.
  // NOTE: Email failure does NOT rollback DB — discovery is still queued for processing.
  try {
    await sendDiscoveryEmails(enriched);
  } catch (emailErr: unknown) {
    const msg: string = emailErr instanceof Error ? emailErr.message : String(emailErr);
    console.error("[discovery] Email send failed:", msg);
  }

  return { id: docId, data: enriched, degraded: docId === undefined };
};