import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "ShenoDev's terms of service — how we work, what we deliver, and the rules for using this website.",
};

const SECTIONS = [
  {
    title: "1. Who We Are",
    body: "ShenoDev (shenodev.tech) is an independent web development practice. Contact: hello@contact.shenodev.tech. By using this website or submitting a form, you agree to these terms.",
  },
  {
    title: "2. Using This Website",
    body: "You may browse, submit inquiries, and book discovery calls for lawful business purposes only. You agree not to misuse the site, attempt to disrupt it, submit unlawful or harmful content, or misrepresent your identity or age.",
  },
  {
    title: "3. Quotes Are Estimates, Not Final Prices",
    body: "Package prices shown on this site (for example 10,000 / 25,000 / 45,000 EGP) are starting prices for defined scopes. Every project receives a written proposal with a fixed scope, timeline, and price before work begins. No work starts and no payment is due until you approve that proposal in writing. There are no hidden fees: anything outside the agreed scope is quoted and approved separately.",
  },
  {
    title: "4. How Projects Work",
    items: [
      "Discovery: you submit the questionnaire and optionally book a call. This is free and creates no obligation.",
      "Proposal: we send scope, timeline, milestones, and a fixed price. It is valid for 30 days.",
      "Deposit: work typically begins after an agreed deposit; the balance follows the milestone schedule in your proposal.",
      "Delivery & acceptance: each milestone is demonstrated for your review. Reasonable revision rounds included in the proposal are honored; out-of-scope changes are quoted separately.",
    ],
  },
  {
    title: "5. Intellectual Property",
    body: "Until final payment, all work product remains the property of ShenoDev. On final payment, ownership of the deliverables described in your proposal transfers to you, excluding third-party libraries and services governed by their own licenses. You warrant that content you provide (text, images, trademarks) is yours to use or properly licensed.",
  },
  {
    title: "6. Third-Party Licenses in Our Work",
    items: [
      "Fonts: Inter and Sora under the SIL Open Font License 1.1; Material Symbols under the Apache License 2.0.",
      "Code libraries and frameworks remain under their original open-source licenses, listed in the project repository where applicable.",
      "Stock or client-supplied media must be licensed by the party that provides it.",
    ],
  },
  {
    title: "7. Warranties & Liability",
    body: "We build with professional care and test before delivery, but we cannot promise uninterrupted or error-free operation of the internet, hosting providers, or third-party services. To the maximum extent permitted by law, our total liability for any project is limited to the fees paid for that project. Nothing here limits liability that cannot be limited by law.",
  },
  {
    title: "8. Termination",
    body: "Either party may stop a project with written notice. You pay for completed milestones and work in progress as defined in your proposal; deposits cover committed work as stated in the proposal. See the Refund Policy for how payments are handled on cancellation.",
  },
  {
    title: "9. Changes to These Terms",
    body: "We may update these terms; the current version on this page applies. Material changes to an in-flight project require written agreement.",
  },
] as const;

const TermsPage = () => (
  <LegalPage
    title="Terms of Service"
    intro="The ground rules for working with ShenoDev — plain language, no surprises."
    effectiveDate="September 21, 2026"
    sections={SECTIONS}
  />
);

export default TermsPage;
