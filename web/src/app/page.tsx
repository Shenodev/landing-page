import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import TechMarquee from "@/components/TechMarquee";
import Services from "@/components/Services";
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
        <ContactForm />
      </main>
      <Footer />
    </>
  );
};

export default Page;
