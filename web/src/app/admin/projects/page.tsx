import type { Metadata } from "next";
import { AdminProjectForm } from "@/components/admin/AdminProjectForm";
import { SectionHeading } from "@/components/ui/SectionHeading";

export const metadata: Metadata = {
  title: "Add Project",
  description: "Hidden admin page to publish portfolio projects.",
  robots: { index: false, follow: false },
};

const AdminProjectsPage = () => (
  <main id="main-content" className="py-24 max-w-[760px] mx-auto px-6 md:px-12">
    <SectionHeading
      title="Add a project"
      subtitle="Hidden admin area — not linked anywhere. Uploads go to Cloudinary folder shenoprojects, then appear in Work."
      className="mb-10"
    />
    <AdminProjectForm />
    <p className="pt-6 text-center text-body-sm text-on-surface-variant">
      Server must have <code className="px-1.5 py-0.5 rounded bg-surface-container-high">ADMIN_SECRET</code> set to
      your admin password, and <code className="px-1.5 py-0.5 rounded bg-surface-container-high">NEXT_PUBLIC_API_URL</code> must
      point at the API.
    </p>
  </main>
);

export default AdminProjectsPage;
