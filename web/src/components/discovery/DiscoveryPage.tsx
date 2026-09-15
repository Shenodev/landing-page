"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { DiscoveryQuestionnaire } from "@/components/discovery/DiscoveryQuestionnaire";
import { DiscoveryScheduler } from "@/components/discovery/DiscoveryScheduler";
import { DiscoverySuccess } from "@/components/discovery/DiscoverySuccess";
import type { DiscoveryFormData } from "@/components/discovery/discoverySchema";
import { MaterialIcon } from "@/components/ui/MaterialIcon";

const MAX_FILES = 10;

export const DiscoveryPage = () => {
  const [step, setStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState<DiscoveryFormData | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [success, setSuccess] = useState(false);

  const handleFormComplete = (data: DiscoveryFormData): void => {
    setFormData(data);
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background text-on-surface antialiased selection:bg-primary/20 selection:text-primary">
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md shadow-sm">
        <div className="flex justify-between items-center w-full px-6 md:px-12 max-w-[1320px] mx-auto h-20">
          <Link href="/" className="flex items-center gap-1 group" aria-label="ShenoDev - Back to home">
            <Image src="/assets/Logo Horizontal without slugan.svg" alt="ShenoDev" width={160} height={36} priority className="h-10 w-auto object-contain" />
          </Link>
          <nav className="hidden md:flex items-center gap-8" aria-label="Primary">
            <Link href="/#services" className="text-label-md text-on-surface-variant hover:text-primary">Services</Link>
            <Link href="/#work" className="text-label-md text-on-surface-variant hover:text-primary">Work</Link>
            <Link href="/discovery" className="text-label-md text-primary">Discovery</Link>
          </nav>
        </div>
      </header>

      <main
        className="flex-grow relative overflow-hidden py-12 md:py-20 px-4 md:px-8"
        style={{
          background: "radial-gradient(circle 800px at 50% -100px, rgba(6,182,212,0.12), transparent 80%)",
        }}
      >
        <div className="max-w-[880px] mx-auto">
          {success ? (
            <DiscoverySuccess formData={formData} />
          ) : (
            <>
              <div className="text-center space-y-4 mb-14">
                <h1 className="font-display text-headline-lg-mobile md:text-headline-lg text-on-surface tracking-tight">
                  Tell Us About Your Vision
                </h1>
                <p className="text-body-md md:text-body-lg text-on-surface-variant max-w-2xl mx-auto">
                  Help us engineer the ideal digital architecture for your business. Fill out this discovery
                  questionnaire to get a precise scope, roadmap, and proposal.
                </p>
                <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-label-sm text-outline">
                  <span className="flex items-center gap-2">
                    <MaterialIcon name="schedule" className="text-primary text-base" /> ~5-7 minutes
                  </span>
                  <span className="hidden sm:inline text-outline-variant/50" aria-hidden="true">
                    •
                  </span>
                  <span className="flex items-center gap-2">
                    <MaterialIcon name="verified" className="text-tertiary text-base" /> 5 Steps
                  </span>
                  <span className="hidden sm:inline text-outline-variant/50" aria-hidden="true">
                    •
                  </span>
                  <span className="flex items-center gap-2">
                    <MaterialIcon name="lock" className="text-primary text-base" /> NDA Protected
                  </span>
                </div>
              </div>

              {step === 1 ? (
                <DiscoveryQuestionnaire
                  files={files}
                  maxFiles={MAX_FILES}
                  onFilesChange={setFiles}
                  onComplete={handleFormComplete}
                />
              ) : (
                <DiscoveryScheduler
                  formData={formData as DiscoveryFormData}
                  files={files}
                  onSuccess={() => setSuccess(true)}
                  onBack={() => setStep(1)}
                />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};