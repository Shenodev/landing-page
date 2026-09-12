import { Resend } from "resend";
import { env } from "../config/env";

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

export type ContactEmailData = {
  name: string;
  email: string;
  message: string;
};

/**
 * Send two emails simultaneously via Resend:
 * - Email 1 to admin@shenodev.tech containing user's name, email, message
 * - Email 2 to user's email from hello@shenodev.tech thanking them
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
    subject: `New Contact: ${name}`,
    html: `
      <div style="font-family:system-ui;padding:24px;background:#0F172A;color:#F8FAFC;">
        <h2 style="color:#06B6D4;">New Contact Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p style="background:#1E293B;padding:12px;border-radius:8px;">${message}</p>
      </div>
    `,
  };

  const welcomeEmail = {
    from: "ShenoDev <hello@shenodev.tech>",
    to: email,
    subject: "Thanks for reaching out to ShenoDev!",
    html: `
      <div style="font-family:system-ui;padding:24px;background:#0F172A;color:#F8FAFC;">
        <h2 style="color:#06B6D4;">Hi ${name},</h2>
        <p>Thanks for reaching out to ShenoDev! We’ve received your message:</p>
        <p style="background:#1E293B;padding:12px;border-radius:8px;font-style:italic;">"${message}"</p>
        <p>Our team will review and get back to you within 24 hours.</p>
        <p style="color:#94A3B8;font-size:13px;">— ShenoDev Team<br/>Think it, Sheno it.</p>
      </div>
    `,
  };

  try {
    const results = await Promise.all([
      resend.emails.send(adminEmail),
      resend.emails.send(welcomeEmail),
    ]);
    const adminId = (results[0] as { id?: string })?.id;
    const welcomeId = (results[1] as { id?: string })?.id;
    console.log("[email] Sent admin + welcome", { adminId, welcomeId });
    return { adminId, welcomeId };
  } catch (err: unknown) {
    const msg: string = err instanceof Error ? err.message : String(err);
    console.error("[email] Failed to send contact emails:", msg);
    // Do not throw - degraded UX, still return 201 for contact submission
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
  } = data;

  const meetingLink = meetingUrl || calendlyEventUri || calendlyEventUrl || "";
  const meetingDisplay = [meetingDate, meetingTime].filter(Boolean).join(" ") || "-";

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
          <tr><td style="padding:8px;border:1px solid #06B6D4;background:#1E293B;"><strong>Meeting Link</strong></td><td style="padding:8px;border:1px solid #06B6D4;background:#1E293B;">${meetingLink ? `<a href="${meetingLink}" style="color:#06B6D4;">${meetingLink}</a>` : "-"}</td></tr>
          <tr><td style="padding:8px;border:1px solid #06B6D4;background:#1E293B;"><strong>Calendly URI</strong></td><td style="padding:8px;border:1px solid #06B6D4;background:#1E293B;">${calendlyEventUri || calendlyEventUrl || "-"}</td></tr>
        </table>
      </div>
    `;

  const adminEmail = {
    from: "ShenoDev <hello@shenodev.tech>",
    to: "admin@shenodev.tech",
    subject: `New Discovery: ${companyName} - ${fullName} (${targetPackage})`,
    html: adminHtml,
  };

  const meetingInfo = meetingDate || meetingTime || meetingLink
    ? `<p>Your scheduled meeting: <strong>${meetingDisplay}</strong>${meetingLink ? ` - <a href="${meetingLink}" style="color:#06B6D4;">${meetingLink}</a>` : ""}</p>`
    : "";

  const welcomeHtml = `
      <div style="font-family:system-ui;padding:24px;background:#0F172A;color:#F8FAFC;">
        <h2 style="color:#06B6D4;">Hi ${fullName},</h2>
        <p>Thanks for submitting your project discovery details for <strong>${companyName}</strong>!</p>
        <p>We’ve received your full business and technical requirements (package: <strong>${targetPackage}</strong>).</p>
        ${meetingInfo}
        <p>Our team will review your project details and get back to you within <strong>24-48 hours</strong> with a precise scope, roadmap, and proposal.</p>
        ${meetingLink ? `<p>Meeting Link: <a href="${meetingLink}" style="color:#06B6D4;">${meetingLink}</a></p>` : ""}
        <p style="color:#94A3B8;font-size:13px;">— ShenoDev Team<br/>Think it, Sheno it.</p>
      </div>
    `;

  const welcomeEmail = {
    from: "ShenoDev <hello@shenodev.tech>",
    to: email,
    subject: "We received your project discovery - ShenoDev",
    html: welcomeHtml,
  };

  try {
    const results = await Promise.all([resend.emails.send(adminEmail), resend.emails.send(welcomeEmail)]);
    const adminId = (results[0] as { id?: string })?.id;
    const welcomeId = (results[1] as { id?: string })?.id;
    console.log("[email] Sent discovery admin + welcome", { adminId, welcomeId });
    return { adminId, welcomeId };
  } catch (err: unknown) {
    const msg: string = err instanceof Error ? err.message : String(err);
    console.error("[email] Failed to send discovery emails:", msg);
    return {};
  }
};

// For testing: allow resetting instance
export const _resetResendForTest = (): void => {
  resendInstance = null;
};
