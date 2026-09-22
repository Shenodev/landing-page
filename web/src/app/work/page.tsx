import type { Metadata } from "next";
import { WorkSection } from "@/components/work/WorkSection";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";

export const metadata: Metadata = {
  title: "Selected Work",
  description: "Explore ShenoDev's portfolio of high-performance web experiences.",
  alternates: { canonical: "https://shenodev.tech/work" },
};

const WorkPage = () => {
  return (
    <>
      <Navbar />
      <main id="main-content">
        <div className="max-w-[1320px] mx-auto px-6 md:px-12 pt-10">
          <Breadcrumbs trail={[{ label: "Selected Work" }]} />
        </div>
        <WorkSection showViewAll={false} headingLevel={1} />
      </main>
      <Footer />
    </>
  );
};

export default WorkPage;