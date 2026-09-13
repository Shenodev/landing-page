import { Resend } from "resend";
import { env } from "../config/env";
import { purifyString, escapeHtml } from "./sanitize";

let resendInstance: InstanceType<typeof Resend> | null = null;

const getResend = (): InstanceType<typeof Resend> | null => {
  const key: string | undefined = env.RESEND_API_KEY ?? process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("[email] RESEND_API_KEY not set - emails will be skipped (degraded)");
    return null;
  }
  if (!resendInstance) {
    resendInstance = new Resend(key);
  }
  return resendInstance;
};

// Domain configuration for Resend - fully env-driven (checks env schema, then process.env, then safe defaults).
const RESEND_FROM: string = (env.RESEND_FROM_EMAIL ?? process.env.RESEND_FROM_EMAIL ?? "hello@contact.shenodev.dpdns.org").trim();
const ADMIN_TO: string = (env.ADMIN_EMAIL ?? process.env.ADMIN_EMAIL ?? "admin@contact.shenodev.dpdns.org").trim();
const PRIMARY_DOMAIN: string = ADMIN_TO.includes("@") ? (ADMIN_TO.split("@")[1] as string) : "contact.shenodev.dpdns.org";
export const FALLBACK_DOMAIN: string = (env.RESEND_FALLBACK_DOMAIN ?? process.env.RESEND_FALLBACK_DOMAIN ?? "shenodev.dpdns.org").trim();
const PRIMARY_FROM = `ShenoDev <${RESEND_FROM}>`;
const FALLBACK_FROM = `ShenoDev <hello@${FALLBACK_DOMAIN}>`;
const PRIMARY_ADMIN = ADMIN_TO;
const FALLBACK_ADMIN = `admin@${FALLBACK_DOMAIN}`;

/**
 * Robust wrapper with dynamic domain fallback for Resend.
 * TRY primary domain (RESEND_FROM_EMAIL / ADMIN_EMAIL, default contact.shenodev.dpdns.org),
 * CATCH fallback (RESEND_FALLBACK_DOMAIN, default shenodev.dpdns.org).
 * Logs clearly which domain succeeded.
 */
export const sendResendEmail = async (params: {
  to?: string;
  replyTo?: string;
  subject: string;
  htmlContent: string;
  isAdminNotification: boolean;
}): Promise<{ id?: string }> => {
  const { to, replyTo, subject, htmlContent, isAdminNotification } = params;
  const resend = getResend();
  if (!resend) {
    console.warn("[email] Skipping sendResendEmail - no Resend instance");
    return {};
  }

  // Determine recipients based on domain and notification type
  const primaryTo: string = isAdminNotification ? PRIMARY_ADMIN : to ?? replyTo ?? "";
  const fallbackTo: string = isAdminNotification ? FALLBACK_ADMIN : to ?? replyTo ?? "";

  if (!primaryTo) {
    console.error("[email] sendResendEmail missing recipient", { isAdminNotification, to, replyTo });
    return {};
  }

  // TRY primary domain
  try {
    const result = (await resend.emails.send({
      from: PRIMARY_FROM,
      to: primaryTo,
      subject,
      html: htmlContent,
      ...(replyTo ? { replyTo } : {}),
    } as never)) as { id?: string };
    console.log(`[email] Sent via PRIMARY domain ${PRIMARY_DOMAIN} to ${primaryTo} | subject: ${subject} | id: ${result?.id ?? "unknown"}`);
    return { id: result?.id };
  } catch (primaryErr: unknown) {
    const primaryMsg: string = primaryErr instanceof Error ? primaryErr.message : String(primaryErr);
    console.warn(`[email] Primary domain ${PRIMARY_DOMAIN} failed for ${primaryTo}: ${primaryMsg} — retrying via FALLBACK ${FALLBACK_DOMAIN}`);

    // CATCH retry with fallback domain
    try {
      const fallbackResult = (await resend.emails.send({
        from: FALLBACK_FROM,
        to: fallbackTo,
        subject,
        html: htmlContent,
        ...(replyTo ? { replyTo } : {}),
      } as never)) as { id?: string };
      console.log(`[email] Sent via FALLBACK domain ${FALLBACK_DOMAIN} to ${fallbackTo} | subject: ${subject} | id: ${fallbackResult?.id ?? "unknown"}`);
      return { id: fallbackResult?.id };
    } catch (fallbackErr: unknown) {
      const fallbackMsg: string = fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr);
      console.error(`[email] Fallback domain ${FALLBACK_DOMAIN} also failed for ${fallbackTo}: ${fallbackMsg}`);
      throw fallbackErr;
    }
  }
};

export type ContactEmailData = {
  name: string;
  email: string;
  message: string;
};

/**
 * Send two emails simultaneously via Resend:
 * - Email 1 to ADMIN_EMAIL containing user's name, email, message
 * - Email 2 to user's email from RESEND_FROM_EMAIL thanking them
 * Returns promise that resolves when both are attempted (logs errors, does not throw for UX)
 */
export const sendContactEmails = async (data: ContactEmailData): Promise<{ adminId?: string; welcomeId?: string }> => {
  const resend = getResend();
  if (!resend) {
    console.warn("[email] Skipping send - no Resend instance");
    return {};
  }

  const { name, email, message } = data;

  const adminEmail = {
    from: "ShenoDev <hello@shenodev.tech>",
    to: "admin@shenodev.tech",
    subject: `New Contact: ${escapeHtml(name)}`,
    html: `
      <div style="font-family:system-ui;padding:24px;background:#0F172A;color:#F8FAFC;">
        <h2 style="color:#06B6D4;">New Contact Submission</h2>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Message:</strong></p>
        <p style="background:#1E293B;padding:12px;border-radius:8px;">${escapeHtml(message)}</p>
      </div>
    `,
  };

  const welcomeEmail = {
    from: "ShenoDev <hello@shenodev.tech>",
    to: email,
    subject: "Thanks for reaching out to ShenoDev!",
    html: `
      <div style="font-family:system-ui;padding:24px;background:#0F172A;color:#F8FAFC;">
        <h2 style="color:#06B6D4;">Hi ${escapeHtml(name)},</h2>
        <p>Thanks for reaching out to ShenoDev! We've received your message:</p>
        <p style="background:#1E293B;padding:12px;border-radius:8px;font-style:italic;">"${escapeHtml(message)}"</p>
        <p>Our team will review and get back to you within 24 hours.</p>
        <p style="color:#94A3B8;font-size:13px;">— ShenoDev Team<br/>Think it, Sheno it.</p>
      </div>
    `,
  };

  // Refactored to use wrapper for dynamic domain fallback
  try {
    const [adminResult, welcomeResult] = await Promise.all([
      sendResendEmail({
        replyTo: email,
        subject: adminEmail.subject,
        htmlContent: adminEmail.html,
        isAdminNotification: true,
      }),
      sendResendEmail({
        to: email,
        subject: welcomeEmail.subject,
        htmlContent: welcomeEmail.html,
        isAdminNotification: false,
      }),
    ]);
    console.log("[email] Sent contact admin + welcome via wrapper", { adminId: adminResult.id, welcomeId: welcomeResult.id });
    return { adminId: adminResult.id, welcomeId: welcomeResult.id };
  } catch (err: unknown) {
    const msg: string = err instanceof Error ? err.message : String(err);
    console.error("[email] Failed to send contact emails (wrapper):", msg);
    return {};
  }
};

export type DiscoveryEmailData = {
  fullName: string;
  companyName: string;
  email: string;
  phone: string;
  businessDesc: string;
  targetAudience: string;
  competitors: string;
  brandStatus: string;
  references: string;
  dislikes: string;
  targetPackage: string;
  requiredFeatures: string;
  integrations: string;
  launchDate: string;
  extraDetails: string;
  meetingDate: string;
  meetingTime: string;
  meetingUrl: string;
  calendlyEventUri: string;
  calendlyEventUrl: string;
  attachmentUrl: string;
  attachmentPublicId: string;
  attachments?: Array<{ url: string; publicId?: string; fileName?: string; mimeType?: string; size?: number }>;
};

export const sendDiscoveryEmails = async (data: DiscoveryEmailData): Promise<{ adminId?: string; welcomeId?: string }> => {
  const resend = getResend();
  if (!resend) {
    console.warn("[email] Skipping discovery send - no Resend instance");
    return {};
  }

  const {
    fullName,
    companyName,
    email,
    phone,
    businessDesc,
    targetAudience,
    competitors,
    brandStatus,
    references,
    dislikes,
    targetPackage,
    requiredFeatures,
    integrations,
    launchDate,
    extraDetails,
    meetingDate,
    meetingTime,
    meetingUrl,
    calendlyEventUri,
    calendlyEventUrl,
    attachmentUrl,
    attachmentPublicId,
    attachments,
  } = data;

  const isApiCalendlyUri = (v: string): boolean => /^https:\/\/api\.calendly\.com\//.test(v);
  const meetingLink = [meetingUrl, calendlyEventUrl, calendlyEventUri]
    .find((v: string) => Boolean(v) && !isApiCalendlyUri(v)) ?? "";
  // Fallback message when no human link resolved (never crash, never send an
  // api.calendly.com resource URI in the confirmation email).
  const meetingLinkFallback: string = meetingLink || (meetingDate || meetingTime ? "Meeting link will be provided shortly" : "");
  const meetingDisplay = [meetingDate, meetingTime].filter(Boolean).join(" ") || "-";

  const attachmentItems: Array<{ url: string; fileName: string; size?: number }> =
    attachments && attachments.length
      ? attachments.map((a) => ({ url: a.url, fileName: a.fileName || a.publicId || a.url, size: a.size }))
      : attachmentUrl
        ? [{ url: attachmentUrl, fileName: attachmentPublicId || attachmentUrl }]
        : [];
  const attachmentList = attachmentItems.length
    ? `<ul style="margin:0;padding-left:16px;">${attachmentItems
        .map(
          (a) =>
            `<li style="padding:4px 0;"><a href="${escapeHtml(a.url)}" style="color:#06B6D4;">${escapeHtml(a.fileName)}</a>${a.size ? ` (${(a.size / 1024).toFixed(1)} KB)` : ""}</li>`
        )
        .join("")}</ul>`
    : "<span>-</span>";

  const adminHtml = `
      <div style="font-family:system-ui;padding:24px;background:#0F172A;color:#F8FAFC;">
        <h2 style="color:#06B6D4;">New Project Discovery Submission</h2>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:8px;border:1px solid #334155;"><strong>Full Name</strong></td><td style="padding:8px;border:1px solid #334155;">${fullName}</td></tr>
          <tr><td style="padding:8px;border:1px solid #334155;"><strong>Company</strong></td><td style="padding:8px;border:1px solid #334155;">${companyName}</td></tr>
          <tr><td style="padding:8px;border:1px solid #334155;"><strong>Email</strong></td><td style="padding:8px;border:1px solid #334155;">${email}</td></tr>
          <tr><td style="padding:8px;border:1px solid #334155;"><strong>Phone</strong></td><td style="padding:8px;border:1px solid #334155;">${phone || "-"}</td></tr>
          <tr><td style="padding:8px;border:1px solid #334155;"><strong>Business</strong></td><td style="padding:8px;border:1px solid #334155;">${businessDesc}</td></tr>
          <tr><td style="padding:8px;border:1px solid #334155;"><strong>Audience</strong></td><td style="padding:8px;border:1px solid #334155;">${targetAudience || "-"}</td></tr>
          <tr><td style="padding:8px;border:1px solid #334155;"><strong>Competitors</strong></td><td style="padding:8px;border:1px solid #334155;">${competitors || "-"}</td></tr>
          <tr><td style="padding:8px;border:1px solid #334155;"><strong>Brand Status</strong></td><td style="padding:8px;border:1px solid #334155;">${brandStatus}</td></tr>
          <tr><td style="padding:8px;border:1px solid #334155;"><strong>References</strong></td><td style="padding:8px;border:1px solid #334155;">${references || "-"}</td></tr>
          <tr><td style="padding:8px;border:1px solid #334155;"><strong>Dislikes</strong></td><td style="padding:8px;border:1px solid #334155;">${dislikes || "-"}</td></tr>
          <tr><td style="padding:8px;border:1px solid #334155;"><strong>Package</strong></td><td style="padding:8px;border:1px solid #334155;">${targetPackage}</td></tr>
          <tr><td style="padding:8px;border:1px solid #334155;"><strong>Features</strong></td><td style="padding:8px;border:1px solid #334155;">${requiredFeatures || "-"}</td></tr>
          <tr><td style="padding:8px;border:1px solid #334155;"><strong>Integrations</strong></td><td style="padding:8px;border:1px solid #334155;">${integrations || "-"}</td></tr>
          <tr><td style="padding:8px;border:1px solid #334155;"><strong>Launch Date</strong></td><td style="padding:8px;border:1px solid #334155;">${launchDate || "-"}</td></tr>
          <tr><td style="padding:8px;border:1px solid #334155;"><strong>Extra</strong></td><td style="padding:8px;border:1px solid #334155;">${extraDetails || "-"}</td></tr>
          <tr><td style="padding:8px;border:1px solid #06B6D4;background:#1E293B;"><strong>Meeting Date</strong></td><td style="padding:8px;border:1px solid #06B6D4;background:#1E293B;">${meetingDate || "-"}</td></tr>
          <tr><td style="padding:8px;border:1px solid #06B6D4;background:#1E293B;"><strong>Meeting Time</strong></td><td style="padding:8px;border:1px solid #06B6D4;background:#1E293B;">${meetingTime || "-"}</td></tr>
          <tr><td style="padding:8px;border:1px solid #06B6D4;background:#1E293B;"><strong>Meeting Link</strong></td><td style="padding:8px;border:1px solid #06B6D4;background:#1E293B;">${meetingLink ? `<a href="${escapeHtml(meetingLink)}" style="color:#06B6D4;">${escapeHtml(meetingLink)}</a>` : meetingLinkFallback || "-"}</td></tr>
          <tr><td style="padding:8px;border:1px solid #06B6D4;background:#1E293B;"><strong>Calendly URI</strong></td><td style="padding:8px;border:1px solid #06B6D4;background:#1E293B;">${calendlyEventUri || calendlyEventUrl || "-"}</td></tr>
          <tr><td style="padding:8px;border:1px solid #06B6D4;background:#1E293B;"><strong>Attachments</strong></td><td style="padding:8px;border:1px solid #06B6D4;background:#1E293B;font-size:12px;">${attachmentList}</td></tr>
        </table>
      </div>
    `;

  const adminEmail = {
    from: "ShenoDev <hello@shenodev.tech>",
    to: "admin@shenodev.tech",
    subject: `New Discovery: ${companyName} - ${fullName} (${targetPackage})`,
    html: adminHtml,
  };

  const meetingInfo = meetingDate || meetingTime || meetingLinkFallback
    ? `<p>Your scheduled meeting: <strong>${meetingDisplay}</strong>${meetingLink ? ` - <a href="${escapeHtml(meetingLink)}" style="color:#06B6D4;">${escapeHtml(meetingLink)}</a>` : meetingLinkFallback ? ` - ${meetingLinkFallback}` : ""}</p>`
    : "";

  const welcomeHtml = `
      <div style="font-family:system-ui;padding:24px;background:#0F172A;color:#F8FAFC;">
        <h2 style="color:#06B6D4;">Hi ${fullName},</h2>
        <p>Thanks for submitting your project discovery details for <strong>${companyName}</strong>!</p>
        <p>We’ve received your full business and technical requirements (package: <strong>${targetPackage}</strong>).</p>
        ${meetingInfo}
        <p>Our team will review your project details and get back to you within <strong>24-48 hours</strong> with a precise scope, roadmap, and proposal.</p>
        ${meetingLink ? `<p>Meeting Link: <a href="${escapeHtml(meetingLink)}" style="color:#06B6D4;">${escapeHtml(meetingLink)}</a></p>` : meetingLinkFallback ? `<p>Meeting Link: ${meetingLinkFallback}</p>` : ""}
        <p style="color:#94A3B8;font-size:13px;">— ShenoDev Team<br/>Think it, Sheno it.</p>
      </div>
    `;

  const welcomeEmail = {
    from: "ShenoDev <hello@shenodev.tech>",
    to: email,
    subject: "We received your project discovery - ShenoDev",
    html: welcomeHtml,
  };

  // Refactored to use wrapper for domain fallback (primary RESEND_FROM_EMAIL -> fallback RESEND_FALLBACK_DOMAIN)
  try {
    const [adminResult, welcomeResult] = await Promise.all([
      sendResendEmail({
        replyTo: email,
        subject: adminEmail.subject,
        htmlContent: adminEmail.html,
        isAdminNotification: true,
      }),
      sendResendEmail({
        to: email,
        subject: welcomeEmail.subject,
        htmlContent: welcomeEmail.html,
        isAdminNotification: false,
      }),
    ]);
    console.log("[email] Sent discovery admin + welcome via wrapper", { adminId: adminResult.id, welcomeId: welcomeResult.id });
    return { adminId: adminResult.id, welcomeId: welcomeResult.id };
  } catch (err: unknown) {
    const msg: string = err instanceof Error ? err.message : String(err);
    console.error("[email] Failed to send discovery emails (wrapper):", msg);
    return {};
  }
};

// For testing: allow resetting instance
export const _resetResendForTest = (): void => {
  resendInstance = null;
};
