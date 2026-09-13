import Work from "@/components/Work";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Work | ShenoDev",
  description: "Explore ShenoDev's portfolio of high-performance web experiences.",
};

const WorkPage = () => {
  return (
    <>
      <Navbar />
      <main>
        <Work showViewAll={false} />
      </main>
      <Footer />
    </>
  );
};

export default WorkPage;
