import { contactSchema, hasNoSQLInjection } from "../schemas/contact";
import { purifyContactInput, hasInjectionAttempt } from "../lib/sanitize";
import { Contact } from "../models/Contact";
import { getConnectionState } from "../config/db";
import { sendContactEmails } from "./email.service";
import { ValidationError } from "../errors/http-errors";
import { ErrorIssue } from "../errors/api-error";
import { ContactSubmission, ContactResult } from "../dto/contact";

/**
 * Validate, purify, persist and email a contact submission.
 *
 * Degraded mode: when the DB is unreachable the request still succeeds (201)
 * and emails still fire - persistence is best-effort, UX is never blocked.
 * Validation and injection failures are thrown as ValidationError.
 */
export const submitContact = async (body: unknown): Promise<ContactResult> => {
  const raw: Record<string, unknown> = (body ?? {}) as Record<string, unknown>;

  // 1. Raw NoSQL injection check on the raw body
  if (hasNoSQLInjection(raw) || hasInjectionAttempt(raw)) {
    throw new ValidationError("Invalid payload detected");
  }

  // 2. Zod typesafe validation
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    const message: string = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
    const issues: ErrorIssue[] = parsed.error.issues.map((i) => ({ message: i.message, path: i.path.filter((p): p is string | number => typeof p === "string" || typeof p === "number") }));
    throw new ValidationError(message, issues);
  }

  // 3. Purify for DOM injection (strip HTML, $ etc)
  const submission: ContactSubmission = purifyContactInput(parsed.data);

  // 4. Persist if DB connected, else degraded mode (still short-circuit to 201)
  let id: unknown = undefined;
  const dbState: number = getConnectionState();
  if (dbState === 1) {
    try {
      // NOTE: submitter IPs are intentionally NOT persisted (data minimization).
      // Rate limiting uses the in-memory request IP only.
      const doc = await Contact.create({
        name: submission.name,
        email: submission.email,
        message: submission.message,
        details: submission.details,
      });
      id = doc._id;
    } catch (dbErr: unknown) {
      const msg: string = dbErr instanceof Error ? dbErr.message : String(dbErr);
      console.error("[contact] DB save failed, returning degraded 201:", msg);
      // Fall through to degraded but still send emails
    }
  }

  // 5. Trigger two Resend emails simultaneously (admin + welcome) - no hardcode, uses env.
  // Await failure to keep test determinism; the error is logged, not rethrown.
  try {
    await sendContactEmails({
      name: submission.name,
      email: submission.email,
      message: submission.message,
    });
  } catch (emailErr: unknown) {
    const msg: string = emailErr instanceof Error ? emailErr.message : String(emailErr);
    console.error("[contact] Email send failed:", msg);
  }

  return { id, submission, degraded: id === undefined };
};