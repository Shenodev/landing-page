import type { Metadata } from "next";
import { AdminConsole } from "@/components/admin/AdminConsole";

export const metadata: Metadata = {
  title: "Project Dashboard",
  description: "Hidden admin dashboard to add, edit, and remove portfolio projects.",
  robots: { index: false, follow: false },
};

const AdminProjectsPage = () => <AdminConsole />;

export default AdminProjectsPage;
