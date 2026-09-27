/**
 * Browser-side validation for the homepage contact form.
 *
 * This exists so that zod does not have to be shipped to every visitor. The
 * contact form is the only thing on the homepage that used the schema, and
 * pulling in `zod` for it added a ~384 KB uncompressed chunk to the homepage's
 * JavaScript. The server remains the authoritative check: it validates the same
 * payload with zod in backend/src/schemas/contact.ts.
 *
 * These rules are therefore a UX affordance, not a security control. If they
 * ever drift from the server schema the only consequence is that a visitor sees
 * the error after the round trip instead of inline - the server still rejects
 * anything invalid. Keep the messages identical to the server's so the
 * experience does not change, and see e2e/contact-validation.spec.ts, which
 * pins every message here.
 *
 * The messages and their order mirror the zod schema exactly, because zod stops
 * at the first failing check in each chain: name is trimmed, then measured, then
 * pattern checked, so "AB" fails on length and "Alex 1" fails on characters.
 */

export type ContactFormValues = {
  name: string;
  email: string;
  details: string;
  privacyConsent: boolean;
  ageConfirmed: boolean;
};

export type ContactFieldName = keyof ContactFormValues;

export type ContactFieldErrors = Partial<Record<ContactFieldName, string>>;

export type ContactIssue = {
  path: [ContactFieldName];
  message: string;
};

/** A draft that has passed validation, with both confirmations proven true. */
export type ValidatedContact = {
  name: string;
  email: string;
  details: string;
  privacyConsent: true;
  ageConfirmed: true;
};

export type ContactParseResult =
  | {
      success: true;
      data: ValidatedContact;
    }
  | {
      success: false;
      error: { issues: ContactIssue[] };
    };

export const NAME_MIN = 2;
export const NAME_MAX = 100;
export const EMAIL_MAX = 200;
export const DETAILS_MIN = 10;
export const DETAILS_MAX = 1000;

/** Letters, spaces, apostrophes and hyphens - the same set the server accepts. */
const NAME_PATTERN = /^[a-zA-Z\s'\-]+$/;

/**
 * Pragmatic address check. Deliberately permissive: `<input type="email">` and
 * the server both re-check, so a false rejection here would needlessly block a
 * legitimate enquiry, which is worse than letting the server adjudicate.
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const asString = (value: unknown): string => (typeof value === "string" ? value : "");

/**
 * Validate the contact draft.
 *
 * Collects an issue per failing field, matching how zod reports a whole object
 * at once, so the form can show every error together.
 */
export const validateContactDraft = (draft: ContactFormValues): ContactParseResult => {
  const issues: ContactIssue[] = [];

  const name = asString(draft.name).trim();
  if (name.length < NAME_MIN) {
    issues.push({ path: ["name"], message: "Name must be at least 2 characters" });
  } else if (name.length > NAME_MAX) {
    issues.push({ path: ["name"], message: "Name must be under 100 characters" });
  } else if (!NAME_PATTERN.test(name)) {
    issues.push({ path: ["name"], message: "Name contains invalid characters" });
  }

  const email = asString(draft.email).trim();
  if (email.length > EMAIL_MAX) {
    issues.push({ path: ["email"], message: "Email must be under 200 characters" });
  } else if (!EMAIL_PATTERN.test(email)) {
    issues.push({ path: ["email"], message: "Invalid email address" });
  }

  const details = asString(draft.details).trim();
  if (details.length < DETAILS_MIN) {
    issues.push({ path: ["details"], message: "Details must be at least 10 characters" });
  } else if (details.length > DETAILS_MAX) {
    issues.push({ path: ["details"], message: "Details must be under 1000 characters" });
  }

  if (draft.privacyConsent !== true) {
    issues.push({ path: ["privacyConsent"], message: "Please accept the privacy notice" });
  }
  if (draft.ageConfirmed !== true) {
    issues.push({ path: ["ageConfirmed"], message: "Please confirm you are 16 or older" });
  }

  if (issues.length > 0) {
    return { success: false, error: { issues } };
  }

  return {
    success: true,
    data: {
      name,
      email: email.toLowerCase(),
      details,
      privacyConsent: true,
      ageConfirmed: true,
    },
  };
};
