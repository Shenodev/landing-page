import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { PrivacyDeletionForm } from "@/components/legal/PrivacyDeletionForm";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "ShenoDev's privacy policy — how we collect, use, and protect your personal data across our website, contact, and discovery forms.",
};

const SECTIONS = [
  {
    title: "1. Who Controls Your Data",
    body: "ShenoDev (shenodev.tech), contact: hello@contact.shenodev.tech. We are the data controller for information submitted through this website.",
  },
  {
    title: "2. Information We Collect — And Nothing More",
    items: [
      "Contact form: name, email, project details.",
      "Discovery questionnaire: name, company, email, phone (optional), business and technical requirements, meeting details, and files you choose to upload.",
      "Consent records: whether you accepted the privacy notice and confirmed you are 16 or older.",
      "We deliberately do not store submitter IP addresses in our database. Rate limiting uses the request IP in memory only.",
      "We do not collect payment details on this site, device fingerprints, or browsing profiles.",
    ],
  },
  {
    title: "3. How We Use Your Information",
    body: "Your data is used solely to respond to your inquiries, evaluate and scope your project, schedule and confirm discovery meetings, prepare proposals, and deliver the services you request. We do not sell, rent, or trade your personal information, and we send no marketing emails — only direct replies and confirmations related to your inquiry. Every non-essential email carries an unsubscribe link.",
  },
  {
    title: "4. Third-Party Services (Audited)",
    items: [
      "Vercel — website hosting and cookieless aggregate analytics.",
      "MongoDB Atlas — database storage for form submissions.",
      "Resend — transactional email delivery (replies and confirmations).",
      "Cloudinary — storage for project images and files you upload.",
      "Calendly — discovery-call scheduling, used only if you book a call, under Calendly's own policy.",
      "Google Fonts — Inter, Sora, and Material Symbols fonts (open-licensed, served without tracking accounts).",
      "Each provider processes data only to provide its service and is bound by its own privacy and security commitments.",
    ],
  },
  {
    title: "5. Data Retention",
    body: "Inquiry and discovery records are kept while we work with you and for up to 24 months afterwards for reference, then removed or anonymized. Unsubscribe records are kept indefinitely to honor your choice. Deletion requests are completed within 30 days (see below).",
  },
  {
    title: "6. Data Security",
    body: "We apply industry-standard safeguards, including encrypted connections (HTTPS), strict input validation and sanitization, rate limiting, timing-safe secret comparison, verified file-type checks on uploads, and restricted access to production credentials. While no method of transmission is 100% secure, we work to protect your information against unauthorized access, alteration, or disclosure.",
  },
  {
    title: "7. Your Rights — Including Deletion",
    body: "Depending on your jurisdiction, you may access, correct, or delete your personal data, object to or restrict processing, and withdraw consent at any time. Use the form below for deletion requests — we erase your data within 30 days and confirm by email. For anything else, email hello@contact.shenodev.tech and we respond within 30 days.",
  },
  {
    title: "8. Emails & Unsubscribing",
    body: "We send only transactional mail: replies, confirmations, and meeting details. Every such email includes an unsubscribe link and a List-Unsubscribe header. Unsubscribing stops all non-essential mail immediately; operational replies to an active inquiry may still reach you until that inquiry closes.",
  },
  {
    title: "9. Cookies & Analytics",
    body: "No advertising trackers. The only browser storage we set is your cookie-banner choice itself. We use cookieless aggregate analytics. Embedded Calendly scheduling may set its own cookies under its own policy. Full details in the Cookie Policy.",
  },
  {
    title: "10. Children's Privacy",
    body: "Our services are for businesses and individuals aged 16 or older. Both forms require confirming you are 16+ before submission, and we do not knowingly collect children's data. If you believe a child has submitted data, contact us and we will delete it promptly.",
  },
  {
    title: "11. Changes to This Policy",
    body: "We may update this policy; the latest version is always published here with the effective date shown below.",
  },
] as const;

const PrivacyPage = () => (
  <LegalPage
    title="Privacy Policy"
    intro="How ShenoDev collects, uses, and protects your information."
    effectiveDate="September 21, 2026"
    sections={SECTIONS}
  >
    <div className="mt-6">
      <PrivacyDeletionForm />
    </div>
  </LegalPage>
);

export default PrivacyPage;
