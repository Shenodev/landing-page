import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Refund Policy",
  description: "ShenoDev's refund policy — deposits, milestones, and cancellations explained upfront.",
};

const SECTIONS = [
  {
    title: "1. The Short Version",
    body: "Discovery calls and quotes are free. Once a project starts, refunds follow completed work: you pay for what is done and reviewed, and unstarted work is refundable. Everything below is also restated in your written proposal before you pay anything.",
  },
  {
    title: "2. Deposits",
    body: "Deposits reserve calendar time and cover initial architecture, setup, and committed work. If you cancel before work begins, the deposit is refunded in full within 14 days. Once work has begun, the deposit covers work performed and is non-refundable to that extent.",
  },
  {
    title: "3. Milestones",
    body: "Each milestone is demonstrated for your acceptance. If a milestone does not match the agreed scope and we cannot fix it within a reasonable time, you may reject that milestone and receive a refund for its unpaid or unaccepted portion. Accepted milestones are non-refundable.",
  },
  {
    title: "4. Cancellations",
    items: [
      "Cancel any time with written notice (email suffices).",
      "You are invoiced only for completed milestones plus verifiable work in progress, as documented in your proposal.",
      "Any prepaid amount for work not started is refunded within 14 days to the original payment method.",
      "Delivered source code for paid milestones remains yours under the Terms of Service.",
    ],
  },
  {
    title: "5. What Is Never Charged",
    body: "No hidden fees, no surprise renewals, no charges for quotes, discovery calls, or proposal revisions. Third-party costs (hosting, domains, SaaS seats) are always quoted separately and paid directly by you where possible.",
  },
  {
    title: "6. How to Request a Refund",
    body: "Email hello@contact.shenodev.tech with your name, project, and reason. We acknowledge within 3 business days and resolve within 14 days. If we disagree, we explain why in writing with reference to your proposal milestones.",
  },
] as const;

const RefundsPage = () => (
  <LegalPage
    title="Refund Policy"
    intro="Fair by default: pay for done work, get back the rest."
    effectiveDate="September 21, 2026"
    sections={SECTIONS}
  />
);

export default RefundsPage;
