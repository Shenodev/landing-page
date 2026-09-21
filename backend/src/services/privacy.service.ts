import { unsubscribeSchema, deletionRequestSchema } from "../schemas/privacy";
import { purifyString } from "../lib/sanitize";
import { UnsubscribedEmail } from "../models/UnsubscribedEmail";
import { PrivacyDeletionRequest } from "../models/PrivacyDeletionRequest";
import { getConnectionState } from "../config/db";
import { sendResendEmail } from "./email.service";
import { escapeHtml } from "../lib/sanitize";
import { ValidationError } from "../errors/http-errors";
import { ErrorIssue } from "../errors/api-error";

const toIssues = (issues: { message: string; path: (string | number | symbol)[] }[]): ErrorIssue[] =>
  issues.map((i) => ({
    message: i.message,
    path: i.path.filter((p): p is string | number => typeof p === "string" || typeof p === "number"),
  }));

/**
 * Record an unsubscribe. Idempotent — already-unsubscribed emails still 200.
 * Degraded mode (no DB): still 200 so the UX promise ("one click") holds;
 * suppression itself is best-effort until the DB is reachable.
 */
export const unsubscribeEmail = async (body: unknown): Promise<{ email: string; degraded: boolean }> => {
  const parsed = unsubscribeSchema.safeParse(body);
  if (!parsed.success) {
    const message: string = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
    throw new ValidationError(message, toIssues(parsed.error.issues));
  }
  const email: string = purifyString(parsed.data.email).toLowerCase();

  if (getConnectionState() === 1) {
    try {
      await UnsubscribedEmail.updateOne({ email }, { $setOnInsert: { email } }, { upsert: true });
      return { email, degraded: false };
    } catch (err: unknown) {
      const msg: string = err instanceof Error ? err.message : String(err);
      console.error("[privacy] Unsubscribe persist failed (degraded):", msg);
    }
  }
  return { email, degraded: true };
};

/**
 * Record a data-deletion request and notify the admin.
 * Actual erasure is performed by an operator within 30 days (see privacy policy);
 * the request itself is acknowledged immediately with 201.
 */
export const requestDeletion = async (body: unknown): Promise<{ id?: unknown; degraded: boolean }> => {
  const parsed = deletionRequestSchema.safeParse(body);
  if (!parsed.success) {
    const message: string = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
    throw new ValidationError(message, toIssues(parsed.error.issues));
  }
  const name: string = purifyString(parsed.data.name);
  const email: string = purifyString(parsed.data.email).toLowerCase();
  const details: string = purifyString(parsed.data.details ?? "");

  let id: unknown = undefined;
  if (getConnectionState() === 1) {
    try {
      const doc = await PrivacyDeletionRequest.create({ name, email, details });
      id = doc._id;
    } catch (err: unknown) {
      const msg: string = err instanceof Error ? err.message : String(err);
      console.error("[privacy] Deletion request persist failed (degraded):", msg);
    }
  }

  try {
    await sendResendEmail({
      subject: "New data-deletion request",
      htmlContent: `<div style="font-family:system-ui;padding:24px;background:#0F172A;color:#F8FAFC;"><h2 style="color:#06B6D4;">Data-Deletion Request</h2><p><strong>Name:</strong> ${escapeHtml(name)}</p><p><strong>Email:</strong> ${escapeHtml(email)}</p><p><strong>Details:</strong></p><p>${escapeHtml(details) || "-"}</p></div>`,
      isAdminNotification: true,
    });
  } catch (err: unknown) {
    const msg: string = err instanceof Error ? err.message : String(err);
    console.error("[privacy] Deletion admin notify failed:", msg);
  }

  return { id, degraded: id === undefined };
};
