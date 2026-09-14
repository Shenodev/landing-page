"use client";

import { useCallback, useState } from "react";
import { submitDiscovery, type DiscoveryPayload } from "@/lib/api";
import type { DiscoveryFormData } from "@/components/discovery/discoverySchema";
import type { MeetingDetails } from "@/components/discovery/calendlyEvent";

type UseCalendlySubmissionResult = {
  submitting: boolean;
  error: string;
  submit: (data: DiscoveryFormData, meeting: MeetingDetails) => Promise<void>;
};

export const useCalendlySubmission = (files: readonly File[]): UseCalendlySubmissionResult => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = useCallback(
    async (data: DiscoveryFormData, meeting: MeetingDetails): Promise<void> => {
      setSubmitting(true);
      setError("");
      try {
        const payload: DiscoveryPayload = {
          ...data,
          meetingDate: meeting.meetingDate,
          meetingTime: meeting.meetingTime,
          meetingUrl: meeting.meetingUrl,
          calendlyEventUri: meeting.eventUri,
          calendlyEventUrl: meeting.inviteeUri,
        };
        await submitDiscovery(payload, files);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[discovery] submit failed:", msg);
        setError(msg);
      } finally {
        setSubmitting(false);
      }
    },
    [files],
  );

  return { submitting, error, submit };
};