import { Navbar } from "@/components/layout/Navbar";
import { Hero } from "@/components/Hero";
import { TechMarquee } from "@/components/TechMarquee";
import { Services } from "@/components/Services";
import { WorkSection } from "@/components/work/WorkSection";
import { ContactSection } from "@/components/contact/ContactSection";
import { Footer } from "@/components/layout/Footer";

const Page = () => {
  return (
    <>
      <Navbar />
      <main id="main-content">
        <Hero />
        <TechMarquee />
        <Services />
        <WorkSection />
        <ContactSection />
      </main>
      <Footer />
    </>
  );
};

export default Page;