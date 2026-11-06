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
      <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
        <MaterialIcon name="check_circle" className="text-primary text-3xl" />
      </div>
      <h1 className="font-display text-headline-lg-mobile md:text-display-hero-mobile font-bold text-on-surface">
        Discovery Received
      </h1>
      <p className="text-body-md text-on-surface-variant max-w-xl mx-auto">
        Your project details{name ? ` for ${name}` : ""} have been logged. We will review the technical parameters before our confirmed call.
      </p>
      <div
        role="status"
        className="bg-surface/80 border border-white/10 rounded-xl p-4 text-body-sm text-on-surface-variant"
      >
        A confirmation has been sent to <strong className="text-on-surface">{formData?.email}</strong> with your
        meeting details.
      </div>
      <Button href="/" size="lg">
        Back to Home
      </Button>
    </div>
  );
};