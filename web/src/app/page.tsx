import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import TechMarquee from "@/components/TechMarquee";
import Services from "@/components/Services";
import Work from "@/components/Work";
import ContactForm from "@/components/ContactForm";
import Footer from "@/components/Footer";

const Page = () => {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <TechMarquee />
        <Services />
        <Work />
        <ContactForm />
      </main>
      <Footer />
    </>
  );
};

export default Page;
