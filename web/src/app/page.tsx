import type { Metadata } from "next";
import { Suspense } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Hero } from "@/components/Hero";
import { TechMarquee } from "@/components/TechMarquee";
import { Services } from "@/components/Services";
import { WorkSection } from "@/components/work/WorkSection";
import { ContactSection } from "@/components/contact/ContactSection";
import { Footer } from "@/components/layout/Footer";
import { WorkSkeleton } from "@/components/work/WorkStates";

export const metadata: Metadata = {
  alternates: { canonical: "https://shenodev.tech" },
};

const Page = () => {
  return (
    <>
      <Navbar />
      <main id="main-content">
        <Hero />
        <TechMarquee />
        <Services />
        <Suspense fallback={<WorkSkeleton showViewAll={true} level={2} />}>
          <WorkSection />
        </Suspense>
        <ContactSection />
      </main>
      <Footer />
    </>
  );
};

export default Page;
