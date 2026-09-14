import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SectionBadge } from "@/components/ui/SectionBadge";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "ShenoDev's privacy policy — how we collect, use, and protect your personal data across our website, contact, and discovery forms.",
};

const SECTIONS: readonly { title: string; body: string }[] = [
  {
    title: "1. Information We Collect",
    body: "We collect the information you voluntarily provide when submitting our contact form or project discovery questionnaire, including your name, email address, phone number, company details, project requirements, and any files you choose to upload. We do not sell, rent, or trade your personal information to third parties.",
  },
  {
    title: "2. How We Use Your Information",
    body: "Your data is used solely to respond to your inquiries, evaluate and scope your project, schedule and confirm discovery meetings, prepare proposals, and deliver the services you request. Communications are sent to the email you provide via the contact form or discovery questionnaire.",
  },
  {
    title: "3. Third-Party Services",
    body: "To operate this website we rely on trusted service providers: Vercel (website hosting), MongoDB Atlas (data storage), Resend (transactional email delivery), and Cloudinary (file and image storage). If you book a discovery call, your chosen meeting time is handled by Calendly under its own privacy policy. Each provider processes data only to the extent required to provide its service and is bound by its own privacy and security commitments.",
  },
  {
    title: "4. Data Retention",
    body: "We retain inquiry and discovery records for as long as needed to respond to you, prepare proposals, and deliver ongoing services, after which they are removed or anonymized in line with our internal retention policies.",
  },
  {
    title: "5. Data Security",
    body: "We apply industry-standard safeguards, including encrypted connections (HTTPS), input validation and sanitization, rate limiting, and restricted access to production credentials. While no method of transmission is 100% secure, we work to protect your information against unauthorized access, alteration, or disclosure.",
  },
  {
    title: "6. Your Rights",
    body: "Depending on your jurisdiction, you may have the right to access, correct, or delete the personal data we hold about you, and to object to or restrict certain processing. To exercise any of these rights, contact us at hello@contact.shenodev.tech and we will respond within 30 days.",
  },
  {
    title: "7. Cookies & Analytics",
    body: "This website does not use advertising trackers. We may use minimal operational cookies or server logs (such as visitor IP addresses) to maintain security and availability. We do not share this data with advertising networks.",
  },
  {
    title: "8. Children's Privacy",
    body: "Our services are intended for businesses and individuals aged 16 or older. We do not knowingly collect personal information from children.",
  },
  {
    title: "9. Changes to This Policy",
    body: "We may update this policy from time to time. The latest version will always be published on this page with the effective date shown below.",
  },
];

const PrivacyPage = () => {
  return (
    <>
      <Navbar />
      <main
        id="main-content"
        className="flex-grow relative overflow-hidden py-12 md:py-20 px-4 md:px-8"
        style={{
          background: "radial-gradient(circle 800px at 50% -100px, rgba(6,182,212,0.12), transparent 80%)",
        }}
      >
        <div className="max-w-[880px] mx-auto">
          <div className="text-center space-y-4 mb-14">
            <SectionBadge className="bg-surface-container-low border-outline-variant/40 shadow-inner">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-primary">SHENODEV | LEGAL</span>
            </SectionBadge>
            <h1 className="font-display text-headline-lg-mobile md:text-headline-lg text-on-surface tracking-tight">
              Privacy Policy
            </h1>
            <p className="text-body-md md:text-body-lg text-on-surface-variant max-w-2xl mx-auto">
              How ShenoDev collects, uses, and protects your information.
            </p>
            <p className="text-label-sm font-medium text-outline">Effective date: September 13, 2026</p>
          </div>

          <div className="space-y-6">
            {SECTIONS.map((section) => (
              <Card
                key={section.title}
                className="relative border-outline-variant/30 hover:border-primary/40 transition-colors p-6 md:p-8 bg-surface-container-low/70 backdrop-blur-md"
              >
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent rounded-t-xl" />
                <h2 className="font-display text-title-md text-on-surface mb-3">{section.title}</h2>
                <p className="text-body-sm leading-[22px] text-on-surface-variant">{section.body}</p>
              </Card>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default PrivacyPage;