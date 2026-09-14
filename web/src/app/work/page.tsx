import type { Metadata } from "next";
import { WorkSection } from "@/components/work/WorkSection";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Work",
  description: "Explore ShenoDev's portfolio of high-performance web experiences.",
};

const WorkPage = () => {
  return (
    <>
      <Navbar />
      <main id="main-content">
        <WorkSection showViewAll={false} />
      </main>
      <Footer />
    </>
  );
};

export default WorkPage;