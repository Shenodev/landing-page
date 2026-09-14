"use client";

import dynamic from "next/dynamic";
import { useCallback } from "react";
import { useCalendlyEventListener, type EventScheduledEvent } from "react-calendly";
import { Card } from "@/components/ui/Card";
import { FormAlert } from "@/components/ui/FormAlert";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import type { DiscoveryFormData } from "@/components/discovery/discoverySchema";
import { parseCalendlyMessage } from "@/components/discovery/calendlyEvent";
import { useCalendlySubmission } from "@/components/discovery/useCalendlySubmission";

const InlineWidget = dynamic(() => import("react-calendly").then((m) => m.InlineWidget), { ssr: false });

type DiscoverySchedulerProps = {
  formData: DiscoveryFormData;
  files: readonly File[];
  onSuccess: () => void;
  onBack: () => void;
};

export const DiscoveryScheduler = ({ formData, files, onSuccess, onBack }: DiscoverySchedulerProps) => {
  const { submitting, error, submit } = useCalendlySubmission(files);
  const calendlyUrl = (process.env.NEXT_PUBLIC_CALENDLY_URL ?? "").trim();

  const handleCalendlyScheduled = useCallback(
    async (e: EventScheduledEvent) => {
      const meeting = parseCalendlyMessage(e);
      if (!meeting) return;
      await submit(formData, meeting);
      onSuccess();
    },
    [formData, submit, onSuccess],
  );

  useCalendlyEventListener({ onEventScheduled: handleCalendlyScheduled });

  return (
    <div className="space-y-6">
      <Card intent="elevated" className="relative border-primary/30 p-6 md:p-8 space-y-4">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent rounded-t-xl" />
        <h2 className="text-title-md text-on-surface">Schedule Your Discovery Call</h2>
        <p className="text-body-sm text-on-surface-variant">
          Pick a time that works for you. Your project details for{" "}
          <strong className="text-on-surface">{formData.companyName}</strong> are saved — scheduling will auto-submit.
        </p>

        {calendlyUrl ? (
          <div className="rounded-xl overflow-hidden border border-outline-variant/30 bg-white" style={{ height: 700 }}>
            <InlineWidget
              url={calendlyUrl}
              styles={{ height: "100%", width: "100%" }}
              pageSettings={{ hideEventTypeDetails: false, hideLandingPageDetails: false }}
            />
          </div>
        ) : (
          <div className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest/60 p-8 text-center space-y-3">
            <MaterialIcon name="event_busy" className="text-outline text-3xl mx-auto block" />
            <p className="text-label-md text-on-surface">Scheduling link not configured</p>
            <p className="text-body-sm text-on-surface-variant max-w-md mx-auto">
              Set <code className="text-primary bg-primary/10 px-1.5 py-0.5 rounded">NEXT_PUBLIC_CALENDLY_URL</code>{" "}
              to your real Calendly event link (e.g.{" "}
              <code className="text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                https://calendly.com/YOUR_USERNAME/your-event-type
              </code>
              ) to enable scheduling.
            </p>
          </div>
        )}

        {submitting && (
          <p className="text-body-sm text-primary animate-pulse" role="status">
            Submitting your discovery + meeting details...
          </p>
        )}
        {error && <FormAlert tone="error">{error}</FormAlert>}

        <button onClick={onBack} className="text-body-sm text-on-surface-variant underline" type="button">
          ← Back to form
        </button>
      </Card>
    </div>
  );
};