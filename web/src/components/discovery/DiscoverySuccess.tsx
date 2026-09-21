"use client";

import { Button } from "@/components/ui/Button";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import type { DiscoveryFormData } from "@/components/discovery/discoverySchema";

type DiscoverySuccessProps = {
  formData: DiscoveryFormData | null;
};

export const DiscoverySuccess = ({ formData }: DiscoverySuccessProps) => {
  const name = formData?.fullName ?? "";

  return (
    <div className="max-w-[880px] mx-auto text-center space-y-6">
      <div className="w-16 h-16 mx-auto rounded-full bg-tertiary-container/20 border border-tertiary flex items-center justify-center">
        <MaterialIcon name="check_circle" className="text-tertiary text-3xl" />
      </div>
      <h1 className="font-display text-headline-lg-mobile md:text-display-hero-mobile font-bold text-on-surface">
        Thank you — Discovery Received!
      </h1>
      <p className="text-body-md text-on-surface-variant max-w-xl mx-auto">
        We&apos;ve received your project details{name ? `, ${name}` : ""}. Our team aims to review within{" "}
        <strong className="text-primary">24-48 hours</strong> and your Calendly meeting is confirmed.
      </p>
      <div
        role="status"
        className="bg-surface-container/50 border border-primary/20 rounded-xl p-4 text-body-sm text-on-surface-variant"
      >
        A confirmation email has been sent to <strong className="text-on-surface">{formData?.email}</strong> with your
        meeting details.
      </div>
      <Button href="/" size="lg">
        Back to Home
      </Button>
    </div>
  );
};