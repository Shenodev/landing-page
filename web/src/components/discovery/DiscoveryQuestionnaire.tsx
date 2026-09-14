"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import {
  discoverySchema,
  type DiscoveryFormData,
} from "@/components/discovery/discoverySchema";
import {
  BasicInfoSection,
  BrandingSection,
  BusinessSection,
  LogisticsSection,
  TechnicalSection,
} from "@/components/discovery/form/sections";

type DiscoveryQuestionnaireProps = {
  files: readonly File[];
  maxFiles: number;
  onFilesChange: (files: File[]) => void;
  onComplete: (data: DiscoveryFormData) => void;
};

export const DiscoveryQuestionnaire = ({
  files,
  maxFiles,
  onFilesChange,
  onComplete,
}: DiscoveryQuestionnaireProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DiscoveryFormData>({
    resolver: zodResolver(discoverySchema),
    mode: "onBlur",
    defaultValues: {
      brandStatus: "ready",
      targetPackage: "dashboard",
    },
  });

  return (
    <form onSubmit={handleSubmit(onComplete)} className="space-y-10" noValidate>
      <BasicInfoSection register={register} errors={errors} />
      <BusinessSection register={register} errors={errors} />
      <BrandingSection register={register} errors={errors} />
      <TechnicalSection register={register} errors={errors} />
      <LogisticsSection
        register={register}
        errors={errors}
        files={files}
        maxFiles={maxFiles}
        onFilesChange={onFilesChange}
      />

      <button
        type="submit"
        className="w-full py-4 px-8 rounded-xl bg-gradient-to-r from-primary-container to-secondary-container text-surface-container-lowest font-bold tracking-wide flex items-center justify-center gap-3 shadow-lg hover:shadow-cyan-500/25 hover:-translate-y-0.5 transition-all active:scale-[0.99]"
      >
        Continue to Scheduling <MaterialIcon name="arrow_forward" className="text-xl" />
      </button>
    </form>
  );
};