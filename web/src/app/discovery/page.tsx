import type { Metadata } from "next";
import { DiscoveryPage } from "@/components/discovery/DiscoveryPage";

export const metadata: Metadata = {
  title: "Project Discovery",
  description:
    "Fill out ShenoDev's project discovery questionnaire to receive a precise scope, roadmap, and proposal for your next web application.",
};

const AppDiscoveryPage = () => <DiscoveryPage />;

export default AppDiscoveryPage;