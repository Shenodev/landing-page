"use client";

import type { UseFormRegister, FieldErrors } from "react-hook-form";
import {
  BRAND_STATUS_OPTIONS,
  PACKAGE_PRICES,
  TARGET_PACKAGE_OPTIONS,
  type DiscoveryFormData,
} from "@/components/discovery/discoverySchema";
import { FileAttachments } from "@/components/discovery/form/FileAttachments";
import { RadioCard } from "@/components/discovery/form/RadioCard";
import { SectionCard } from "@/components/discovery/form/SectionCard";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

type SectionProps = {
  register: UseFormRegister<DiscoveryFormData>;
  errors: FieldErrors<DiscoveryFormData>;
};

export const BasicInfoSection = ({ register, errors }: SectionProps) => (
  <SectionCard step="01" title="Basic Information" subtitle="Primary point of contact" required>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Field id="fullName" label={<>Full Name <span className="text-primary">*</span></>} error={errors.fullName?.message}>
        <Input
          id="fullName"
          placeholder="Alex Vance"
          {...register("fullName")}
          invalid={Boolean(errors.fullName)}
        />
      </Field>
      <Field id="companyName" label={<>Company / Project Name <span className="text-primary">*</span></>} error={errors.companyName?.message}>
        <Input
          id="companyName"
          placeholder="Vance Dynamics Corp"
          {...register("companyName")}
          invalid={Boolean(errors.companyName)}
        />
      </Field>
      <Field id="discovery-email" label={<>Work Email <span className="text-primary">*</span></>} error={errors.email?.message}>
        <Input
          id="discovery-email"
          type="email"
          placeholder="alex@vancedynamics.io"
          {...register("email")}
          invalid={Boolean(errors.email)}
        />
      </Field>
      <Field id="phone" label="Phone / WhatsApp">
        <Input id="phone" type="tel" placeholder="+20 100 000 0000" {...register("phone")} />
      </Field>
    </div>
  </SectionCard>
);

export const BusinessSection = ({ register, errors }: SectionProps) => (
  <SectionCard step="02" title="Business & Audience" subtitle="Defining your value proposition">
    <div className="space-y-6">
      <Field id="businessDesc" label={<>Core Product / Service Description *</>} error={errors.businessDesc?.message}>
        <Textarea
          id="businessDesc"
          rows={3}
          placeholder="Briefly describe what your organization does..."
          {...register("businessDesc")}
          invalid={Boolean(errors.businessDesc)}
        />
      </Field>
      <Field id="targetAudience" label="Target Audience & ICP">
        <Textarea id="targetAudience" rows={2} placeholder="Who is the ultimate decision maker?" {...register("targetAudience")} />
      </Field>
      <Field id="competitors" label="Top 2-3 Competitors">
        <Textarea id="competitors" rows={2} placeholder="https://competitor-one.com" {...register("competitors")} />
      </Field>
    </div>
  </SectionCard>
);

export const BrandingSection = ({ register, errors }: SectionProps) => (
  <SectionCard step="03" title="Design & Branding" subtitle="Visual guidelines and preferences">
    <div className="space-y-3">
      <p className="text-label-md text-on-surface">Current Brand Identity Status</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {BRAND_STATUS_OPTIONS.map((option) => (
          <RadioCard
            key={option}
            label={option.replace("_", " ")}
            value={option}
            registration={register("brandStatus")}
          />
        ))}
      </div>
      {errors.brandStatus && <p className="text-[12px] text-error">{errors.brandStatus.message}</p>}
    </div>
    <Field id="references" label="Reference Websites" error={errors.references?.message}>
      <Textarea
        id="references"
        rows={3}
        placeholder="linear.app for UX, stripe.com for hierarchy..."
        {...register("references")}
      />
    </Field>
    <Field id="dislikes" label="Disliked Colors/Styles" error={errors.dislikes?.message}>
      <Textarea id="dislikes" rows={2} placeholder="Avoid neon pinks..." {...register("dislikes")} />
    </Field>
  </SectionCard>
);

export const TechnicalSection = ({ register, errors }: SectionProps) => (
  <SectionCard step="04" title="Technical Needs & Scope" subtitle="Architecture packages and integrations">
    <div className="space-y-3">
      <p className="text-label-md text-on-surface">Select Your Target Architecture Package *</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {TARGET_PACKAGE_OPTIONS.map((option) => (
          <RadioCard
            key={option}
            label={option}
            value={option}
            caption={<span className="text-label-sm text-primary font-mono">{PACKAGE_PRICES[option]}</span>}
            registration={register("targetPackage")}
          />
        ))}
      </div>
      {errors.targetPackage && <p className="text-[12px] text-error">{errors.targetPackage.message}</p>}
    </div>
    <Field id="requiredFeatures" label="Top 3 Essential Features Needed" error={errors.requiredFeatures?.message}>
      <Textarea
        id="requiredFeatures"
        rows={3}
        className="font-mono text-sm resize-none"
        placeholder={"1. Magic link auth\n2. Stripe billing\n3. Telemetry dashboard"}
        {...register("requiredFeatures")}
      />
    </Field>
    <Field id="integrations" label="External Integrations & Third-Party APIs" error={errors.integrations?.message}>
      <Textarea id="integrations" rows={2} placeholder="Resend, HubSpot, Stripe..." {...register("integrations")} />
    </Field>
  </SectionCard>
);

type LogisticsSectionProps = SectionProps & {
  files: readonly File[];
  maxFiles: number;
  onFilesChange: (files: File[]) => void;
};

export const LogisticsSection = ({ register, errors, files, maxFiles, onFilesChange }: LogisticsSectionProps) => (
  <SectionCard step="05" title="Project Logistics & Timeline" subtitle="Deadlines and handover">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Field id="launchDate" label="Target Launch Date" error={errors.launchDate?.message}>
        <Input
          id="launchDate"
          type="date"
          className="[color-scheme:dark]"
          {...register("launchDate")}
          invalid={Boolean(errors.launchDate)}
        />
      </Field>
      <Field id="extraDetails" label="Extra Details" error={errors.extraDetails?.message}>
        <Input id="extraDetails" placeholder="NDA, priority, etc." {...register("extraDetails")} />
      </Field>
    </div>
    <Field label="Additional Files, RFPs, Wireframes, or Specs">
      <FileAttachments files={files} maxFiles={maxFiles} onChange={onFilesChange} />
    </Field>
  </SectionCard>
);