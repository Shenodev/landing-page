import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "ShenoDev's cookie policy — what little we store, why, and how to control it.",
};

const SECTIONS = [
  {
    title: "1. Our Approach: As Few Cookies As Possible",
    body: "This site runs no advertising trackers and no cross-site profiling. The only thing stored in your browser by us is your cookie-banner choice itself (accepted or declined), kept on your device for 12 months so we stop asking.",
  },
  {
    title: "2. What May Be Stored",
    items: [
      "shenodev-cookie-consent — your banner choice (functional, 12 months, first-party).",
      "Server logs — our host may log IP addresses and user agents briefly for security and availability. We do not use them for profiling.",
      "Vercel Analytics — privacy-friendly, cookieless aggregate page metrics. No personal data, no cross-site tracking.",
      "Calendly widget — if you open the scheduler, Calendly may set its own cookies under its own policy to run the booking flow.",
    ],
  },
  {
    title: "3. Managing Cookies",
    body: "You can change your choice any time by clearing this site's storage in your browser settings — the banner will reappear. You can also block cookies browser-wide, though the Calendly scheduler needs its cookies to book a call (the contact form still works without them).",
  },
  {
    title: "4. Do Not Track",
    body: "We honor the spirit of Do Not Track: with no advertising or profiling in place, there is nothing to opt out of beyond the strictly functional items above.",
  },
  {
    title: "5. Questions",
    body: "Email hello@contact.shenodev.tech about anything cookie- or privacy-related. See also the Privacy Policy for the full picture.",
  },
] as const;

const CookiesPage = () => (
  <LegalPage
    title="Cookie Policy"
    intro="No ad trackers. One functional choice-cookie. That's the whole list."
    effectiveDate="September 21, 2026"
    sections={SECTIONS}
  />
);

export default CookiesPage;
