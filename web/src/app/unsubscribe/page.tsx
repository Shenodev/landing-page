import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { UnsubscribeForm } from "@/components/legal/UnsubscribeForm";

export const metadata: Metadata = {
  title: "Unsubscribe",
  description: "Stop non-essential emails from ShenoDev in one click.",
  robots: { index: false, follow: false },
};

const UnsubscribePage = () => (
  <>
    <Navbar />
    <main id="main-content" className="py-24 max-w-[640px] mx-auto px-6 md:px-12">
      <UnsubscribeForm />
    </main>
    <Footer />
  </>
);

export default UnsubscribePage;
