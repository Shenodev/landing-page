"use client";

import { useState, type ChangeEvent } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import { useCalendlyEventListener, type EventScheduledEvent } from "react-calendly";

const InlineWidget = dynamic(() => import("react-calendly").then((m) => m.InlineWidget), { ssr: false });

type DiscoveryFormData = {
  fullName: string;
  companyName: string;
  email: string;
  phone: string;
  businessDesc: string;
  targetAudience: string;
  competitors: string;
  brandStatus: "ready" | "logo_only" | "need_identity";
  references: string;
  dislikes: string;
  targetPackage: "corporate" | "dashboard" | "platform";
  requiredFeatures: string;
  integrations: string;
  launchDate: string;
  extraDetails: string;
};

const MAX_FILES = 10;

const DiscoveryPage = () => {
  const [step, setStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState<DiscoveryFormData | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const calendlyUrl: string = (process.env.NEXT_PUBLIC_CALENDLY_URL ?? "").trim();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<DiscoveryFormData>({
    mode: "onBlur",
    defaultValues: {
      brandStatus: "ready",
      targetPackage: "dashboard",
    },
  });

  const onFormSubmit: SubmitHandler<DiscoveryFormData> = (data) => {
    setFormData(data);
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCalendlyScheduled = async (e: EventScheduledEvent): Promise<void> => {
    if (!formData) return;
    setSubmitting(true);
    setError("");
    try {
      // react-calendly delivers a MessageEvent where e.data is
      // { event: "calendly.event_scheduled", payload: { event: { uri }, invitee: { uri } } }
      const data = e.data as { event?: string; payload?: { event?: { uri?: string }; invitee?: { uri?: string } } };
      if (!data || data.event !== "calendly.event_scheduled" || !data.payload) {
        return;
      }
      // Defensive: only trust messages that actually come from Calendly's embed
      const origin: string = typeof e.origin === "string" ? e.origin : "";
      if (origin && !origin.includes("calendly.com")) {
        console.warn("[discovery] Ignoring calendar event from non-Calendly origin:", origin);
        return;
      }
      const eventUri: string = data.payload.event?.uri || "";
      const inviteeUri: string = data.payload.invitee?.uri || "";
      const now = new Date();
      const meetingDate: string = now.toISOString().split("T")[0];
      const meetingTime: string = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      const backendUrl: string | undefined = process.env.NEXT_PUBLIC_API_URL;
      if (!backendUrl) throw new Error("NEXT_PUBLIC_API_URL not configured");
      const isMultipart: boolean = selectedFiles.length > 0;
      const res: Response = await (async (): Promise<Response> => {
        if (isMultipart) {
          const fd = new FormData();
          Object.entries({ ...formData, meetingDate, meetingTime, meetingUrl: eventUri, calendlyEventUri: eventUri, calendlyEventUrl: inviteeUri }).forEach(([k, v]) =>
            fd.append(k, v as string)
          );
          selectedFiles.forEach((file) => fd.append("attachments", file));
          return fetch(`${backendUrl}/api/discovery`, { method: "POST", body: fd });
        }
        const payload = { ...formData, meetingDate, meetingTime, meetingUrl: eventUri, calendlyEventUri: eventUri, calendlyEventUrl: inviteeUri };
        return fetch(`${backendUrl}/api/discovery`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      })();
      if (!res.ok) {
        const data = (await res.json().catch(() => ({ message: "Submission failed" }))) as { message: string };
        throw new Error(data.message || `Server ${res.status}`);
      }
      setSuccess(true);
    } catch (err: unknown) {
      const msg: string = err instanceof Error ? err.message : String(err);
      console.error("[discovery] submit failed:", msg);
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFilesChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const files: File[] = Array.from(e.target.files ?? []);
    setSelectedFiles((prev) => [...prev, ...files].slice(0, MAX_FILES));
    e.target.value = "";
  };

  const removeFile = (index: number): void => {
    setSelectedFiles((prev) => prev.filter((_: File, i: number) => i !== index));
  };

  useCalendlyEventListener({
    onEventScheduled: handleCalendlyScheduled,
  });

  if (success) {
    return (
      <div className="min-h-screen bg-background text-on-surface flex flex-col items-center justify-center px-6 py-12">
        <div className="max-w-[880px] mx-auto text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-tertiary-container/20 border border-tertiary flex items-center justify-center">
            <span className="material-symbols-outlined text-tertiary text-3xl">check_circle</span>
          </div>
          <h1 className="font-display text-[32px] leading-[40px] font-bold text-on-surface">Thank you — Discovery Received!</h1>
          <p className="font-body text-[15px] leading-[24px] text-on-surface-variant max-w-xl mx-auto">
            We’ve received your project details{formData?.fullName ? `, ${formData.fullName}` : ""}. Our team will review within <strong className="text-primary">24-48 hours</strong> and your Calendly meeting is confirmed.
          </p>
          <div className="bg-surface-container/50 border border-primary/20 rounded-xl p-4 text-[13px] text-on-surface-variant">
            A confirmation email has been sent to <strong className="text-on-surface">{formData?.email}</strong> with your meeting details.
          </div>
          <Link href={"/" as never} className="inline-flex items-center justify-center bg-primary-container hover:bg-primary text-on-primary-container px-6 py-3 rounded-xl font-semibold glow-button">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-surface antialiased selection:bg-primary/20 selection:text-primary">
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md shadow-sm">
        <div className="flex justify-between items-center w-full px-6 md:px-12 max-w-[1320px] mx-auto h-20">
          <Link href={"/" as never} className="flex items-center gap-1 group">
            <Image src="/assets/Logo Horizontal without slugan.svg" alt="ShenoDev" width={160} height={36} priority style={{ height: 28, width: "auto", objectFit: "contain" }} />
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <Link href={"/#services" as never} className="text-[14px] font-medium text-on-surface-variant hover:text-primary">Services</Link>
            <Link href={"/#work" as never} className="text-[14px] font-medium text-on-surface-variant hover:text-primary">Work</Link>
            <Link href={"/discovery" as never} className="text-[14px] font-medium text-primary">Discovery</Link>
          </nav>
        </div>
      </header>

      <main className="flex-grow relative overflow-hidden py-12 md:py-20 px-4 md:px-8" style={{ background: "radial-gradient(circle 800px at 50% -100px, rgba(6,182,212,0.12), transparent 80%)" }}>
        <div className="max-w-[880px] mx-auto">
          <div className="text-center space-y-4 mb-14">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-container-low border border-outline-variant/40 shadow-inner">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[11px] font-semibold text-primary tracking-wide">SHENODEV ONBOARDING | Project Discovery</span>
            </div>
            <h1 className="font-display text-[32px] md:text-[48px] font-bold text-on-surface tracking-tight">Tell Us About Your Vision</h1>
            <p className="font-body text-[15px] md:text-[18px] text-on-surface-variant max-w-2xl mx-auto">
              Help us engineer the ideal digital architecture for your business. Fill out this discovery questionnaire to get a precise scope, roadmap, and proposal.
            </p>
            <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-[11px] font-semibold text-outline">
              <span className="flex items-center gap-2"><span className="material-symbols-outlined text-primary text-base">schedule</span> ~5-7 minutes</span>
              <span className="text-outline-variant/50 hidden sm:inline">•</span>
              <span className="flex items-center gap-2"><span className="material-symbols-outlined text-tertiary text-base">verified</span> 5 Steps</span>
              <span className="text-outline-variant/50 hidden sm:inline">•</span>
              <span className="flex items-center gap-2"><span className="material-symbols-outlined text-primary text-base">lock</span> NDA Protected</span>
            </div>
          </div>

          {step === 1 ? (
            <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-10" noValidate>
              {/* SECTION 1: Basic Information */}
              <div className="relative bg-surface-container-low/70 backdrop-blur-md border border-outline-variant/30 hover:border-primary/40 transition-colors p-6 md:p-10 rounded-xl space-y-6">
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent rounded-t-xl" />
                <div className="flex items-center justify-between pb-4 border-b border-outline-variant/20">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-surface-container-high text-primary text-sm border border-outline-variant/40">01</span>
                    <div>
                      <h2 className="text-[18px] font-semibold text-on-surface">Basic Information</h2>
                      <p className="text-[13px] text-on-surface-variant">Primary point of contact</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded">Required</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-[14px] font-medium text-on-surface" htmlFor="fullName">Full Name <span className="text-primary">*</span></label>
                    <input {...register("fullName", { required: "Full name required", minLength: 2 })} className="w-full bg-surface-container-lowest/80 border border-outline-variant/40 rounded-lg px-4 py-3 text-[15px] text-on-surface placeholder-outline/50 focus:ring-2 focus:ring-primary focus:border-primary outline-none" placeholder="Alex Vance" />
                    {errors.fullName && <p className="text-[12px] text-error">{errors.fullName.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[14px] font-medium text-on-surface" htmlFor="companyName">Company / Project Name <span className="text-primary">*</span></label>
                    <input {...register("companyName", { required: "Company required" })} className="w-full bg-surface-container-lowest/80 border border-outline-variant/40 rounded-lg px-4 py-3 text-[15px] text-on-surface placeholder-outline/50 focus:ring-2 focus:ring-primary outline-none" placeholder="Vance Dynamics Corp" />
                    {errors.companyName && <p className="text-[12px] text-error">{errors.companyName.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[14px] font-medium text-on-surface">Work Email <span className="text-primary">*</span></label>
                    <input {...register("email", { required: "Email required", pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Invalid email" } })} className="w-full bg-surface-container-lowest/80 border border-outline-variant/40 rounded-lg px-4 py-3 text-[15px] text-on-surface placeholder-outline/50 focus:ring-2 focus:ring-primary outline-none" placeholder="alex@vancedynamics.io" type="email" />
                    {errors.email && <p className="text-[12px] text-error">{errors.email.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[14px] font-medium text-on-surface">Phone / WhatsApp</label>
                    <input {...register("phone")} className="w-full bg-surface-container-lowest/80 border border-outline-variant/40 rounded-lg px-4 py-3 text-[15px] text-on-surface placeholder-outline/50 focus:ring-2 focus:ring-primary outline-none" placeholder="+20 100 000 0000" type="tel" />
                  </div>
                </div>
              </div>

              {/* SECTION 2: Business & Audience */}
              <div className="relative bg-surface-container-low/70 backdrop-blur-md border border-outline-variant/30 hover:border-primary/40 transition-colors p-6 md:p-10 rounded-xl space-y-6">
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent rounded-t-xl" />
                <div className="flex items-center gap-3 pb-4 border-b border-outline-variant/20">
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-surface-container-high text-primary text-sm border border-outline-variant/40">02</span>
                  <div>
                    <h2 className="text-[18px] font-semibold text-on-surface">Business & Audience</h2>
                    <p className="text-[13px] text-on-surface-variant">Defining your value proposition</p>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-[14px] font-medium text-on-surface">Core Product / Service Description *</label>
                    <textarea {...register("businessDesc", { required: "Required", minLength: 10 })} className="w-full bg-surface-container-lowest/80 border border-outline-variant/40 rounded-lg px-4 py-3 text-[15px] text-on-surface placeholder-outline/50 focus:ring-2 focus:ring-primary outline-none" placeholder="Briefly describe what your organization does..." rows={3} />
                    {errors.businessDesc && <p className="text-[12px] text-error">{errors.businessDesc.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[14px] font-medium text-on-surface">Target Audience & ICP</label>
                    <textarea {...register("targetAudience")} className="w-full bg-surface-container-lowest/80 border border-outline-variant/40 rounded-lg px-4 py-3 text-[15px] text-on-surface placeholder-outline/50 focus:ring-2 focus:ring-primary outline-none" placeholder="Who is the ultimate decision maker?" rows={2} />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[14px] font-medium text-on-surface">Top 2-3 Competitors</label>
                    <textarea {...register("competitors")} className="w-full bg-surface-container-lowest/80 border border-outline-variant/40 rounded-lg px-4 py-3 text-[15px] text-on-surface placeholder-outline/50 focus:ring-2 focus:ring-primary outline-none" placeholder="https://competitor-one.com" rows={2} />
                  </div>
                </div>
              </div>

              {/* SECTION 3: Design & Branding */}
              <div className="relative bg-surface-container-low/70 backdrop-blur-md border border-outline-variant/30 hover:border-primary/40 transition-colors p-6 md:p-10 rounded-xl space-y-6">
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent rounded-t-xl" />
                <div className="flex items-center gap-3 pb-4 border-b border-outline-variant/20">
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-surface-container-high text-primary text-sm border border-outline-variant/40">03</span>
                  <div>
                    <h2 className="text-[18px] font-semibold text-on-surface">Design & Branding</h2>
                    <p className="text-[13px] text-on-surface-variant">Visual guidelines and preferences</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="block text-[14px] font-medium text-on-surface">Current Brand Identity Status</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(["ready", "logo_only", "need_identity"] as const).map((v) => (
                      <label key={v} className="relative flex flex-col p-4 rounded-xl border border-outline-variant/40 bg-surface-container-lowest/80 cursor-pointer hover:border-primary/60">
                        <input type="radio" value={v} {...register("brandStatus", { required: true })} className="sr-only peer" defaultChecked={v === "ready"} />
                        <span className="text-[14px] font-semibold text-on-surface peer-checked:text-primary capitalize">{v.replace("_", " ")}</span>
                        <span className="absolute top-3 right-3 w-4 h-4 rounded-full border border-outline-variant peer-checked:border-primary peer-checked:bg-primary" />
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-[14px] font-medium text-on-surface">Reference Websites</label>
                  <textarea {...register("references")} className="w-full bg-surface-container-lowest/80 border border-outline-variant/40 rounded-lg px-4 py-3 text-[15px] text-on-surface placeholder-outline/50 focus:ring-2 focus:ring-primary outline-none" placeholder="linear.app for UX, stripe.com for hierarchy..." rows={3} />
                </div>
                <div className="space-y-2">
                  <label className="block text-[14px] font-medium text-on-surface">Disliked Colors/Styles</label>
                  <textarea {...register("dislikes")} className="w-full bg-surface-container-lowest/80 border border-outline-variant/40 rounded-lg px-4 py-3 text-[15px] text-on-surface placeholder-outline/50 focus:ring-2 focus:ring-primary outline-none" placeholder="Avoid neon pinks..." rows={2} />
                </div>
              </div>

              {/* SECTION 4: Technical Needs & Scope */}
              <div className="relative bg-surface-container-low/70 backdrop-blur-md border border-outline-variant/30 hover:border-primary/40 transition-colors p-6 md:p-10 rounded-xl space-y-6">
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent rounded-t-xl" />
                <div className="flex items-center gap-3 pb-4 border-b border-outline-variant/20">
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-surface-container-high text-primary text-sm border border-outline-variant/40">04</span>
                  <div>
                    <h2 className="text-[18px] font-semibold text-on-surface">Technical Needs & Scope</h2>
                    <p className="text-[13px] text-on-surface-variant">Architecture packages and integrations</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="block text-[14px] font-medium text-on-surface">Select Your Target Architecture Package *</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(["corporate", "dashboard", "platform"] as const).map((v) => (
                      <label key={v} className="relative flex flex-col p-5 rounded-xl border border-outline-variant/40 bg-surface-container-lowest/80 cursor-pointer hover:border-primary/60">
                        <input type="radio" value={v} {...register("targetPackage", { required: true })} className="sr-only peer" defaultChecked={v === "dashboard"} />
                        <span className="text-[14px] font-semibold text-on-surface capitalize peer-checked:text-primary">{v}</span>
                        <span className="text-[11px] text-primary font-mono">{v === "corporate" ? "10,000 EGP" : v === "dashboard" ? "25,000 EGP" : "45,000 EGP"}</span>
                        <span className="absolute inset-0 rounded-xl border-2 border-primary opacity-0 peer-checked:opacity-100 pointer-events-none" />
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-[14px] font-medium text-on-surface">Top 3 Essential Features Needed</label>
                  <textarea {...register("requiredFeatures")} className="w-full bg-surface-container-lowest/80 border border-outline-variant/40 rounded-lg px-4 py-3 text-[15px] text-on-surface placeholder-outline/50 focus:ring-2 focus:ring-primary outline-none font-mono text-sm" placeholder="1. Magic link auth&#10;2. Stripe billing&#10;3. Telemetry dashboard" rows={3} />
                </div>
                <div className="space-y-2">
                  <label className="block text-[14px] font-medium text-on-surface">External Integrations & Third-Party APIs</label>
                  <textarea {...register("integrations")} className="w-full bg-surface-container-lowest/80 border border-outline-variant/40 rounded-lg px-4 py-3 text-[15px] text-on-surface placeholder-outline/50 focus:ring-2 focus:ring-primary outline-none" placeholder="Resend, HubSpot, Stripe..." rows={2} />
                </div>
              </div>

              {/* SECTION 5: Project Logistics */}
              <div className="relative bg-surface-container-low/70 backdrop-blur-md border border-outline-variant/30 hover:border-primary/40 transition-colors p-6 md:p-10 rounded-xl space-y-6">
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent rounded-t-xl" />
                <div className="flex items-center gap-3 pb-4 border-b border-outline-variant/20">
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-surface-container-high text-primary text-sm border border-outline-variant/40">05</span>
                  <div>
                    <h2 className="text-[18px] font-semibold text-on-surface">Project Logistics & Timeline</h2>
                    <p className="text-[13px] text-on-surface-variant">Deadlines and handover</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-[14px] font-medium text-on-surface">Target Launch Date</label>
                    <input {...register("launchDate")} type="date" className="w-full bg-surface-container-lowest/80 border border-outline-variant/40 rounded-lg px-4 py-3 text-[15px] text-on-surface focus:ring-2 focus:ring-primary outline-none [color-scheme:dark]" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[14px] font-medium text-on-surface">Extra Details</label>
                    <input {...register("extraDetails")} className="w-full bg-surface-container-lowest/80 border border-outline-variant/40 rounded-lg px-4 py-3 text-[15px] text-on-surface placeholder-outline/50 focus:ring-2 focus:ring-primary outline-none" placeholder="NDA, priority, etc." />
                  </div>
                </div>
<div className="space-y-2">
                    <label className="block text-[14px] font-medium text-on-surface">Additional Files, RFPs, Wireframes, or Specs</label>
                    <div className="border-2 border-dashed border-outline-variant/50 hover:border-primary/60 bg-surface-container-lowest/60 rounded-xl p-6 text-center transition-colors">
                      <input
                        type="file"
                        multiple
                        accept="image/*,.pdf,.zip,.doc,.docx"
                        onChange={handleFilesChange}
                        className="hidden"
                        id="discovery-file"
                      />
                      <label htmlFor="discovery-file" className="flex flex-col items-center justify-center gap-2 cursor-pointer">
                        <span className="material-symbols-outlined text-primary text-2xl">cloud_upload</span>
                        <span className="text-[13px] text-on-surface font-medium">
                          {selectedFiles.length > 0 ? `${selectedFiles.length} file${selectedFiles.length > 1 ? "s" : ""} selected` : "Drag & drop files or browse"}
                        </span>
                        <span className="text-[11px] text-outline">PDF, images, DOCX, ZIP (up to {MAX_FILES} files, 10MB each) — stored via Cloudinary</span>
                      </label>
                    </div>
                    {selectedFiles.length > 0 && (
                      <ul className="space-y-2">
                        {selectedFiles.map((f, i) => (
                          <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-3 bg-surface-container-lowest/80 border border-outline-variant/40 rounded-lg px-3 py-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="material-symbols-outlined text-primary text-base">attach_file</span>
                              <span className="text-[13px] text-on-surface truncate">{f.name}</span>
                              <span className="text-[11px] text-outline whitespace-nowrap">({(f.size / 1024).toFixed(1)} KB)</span>
                            </div>
                            <button type="button" onClick={() => removeFile(i)} className="text-[12px] text-error hover:text-error/80" aria-label={`Remove ${f.name}`}>
                              Remove
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
              </div>

              <button type="submit" className="w-full py-4 px-8 rounded-xl bg-gradient-to-r from-primary-container to-secondary-container text-surface-container-lowest font-bold tracking-wide flex items-center justify-center gap-3 shadow-lg hover:shadow-cyan-500/25 hover:-translate-y-0.5 transition-all active:scale-[0.99]">
                Continue to Scheduling <span className="material-symbols-outlined text-xl">arrow_forward</span>
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="relative bg-surface-container-low/70 backdrop-blur-md border border-primary/30 p-6 md:p-8 rounded-xl space-y-4">
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent rounded-t-xl" />
                <h2 className="text-[18px] font-semibold text-on-surface">Schedule Your Discovery Call</h2>
                <p className="text-[13px] text-on-surface-variant">Pick a time that works for you. Your project details for <strong className="text-on-surface">{formData?.companyName}</strong> are saved — scheduling will auto-submit.</p>
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
                    <span className="material-symbols-outlined text-outline text-3xl mx-auto block">event_busy</span>
                    <p className="text-[14px] font-semibold text-on-surface">Scheduling link not configured</p>
                    <p className="text-[13px] text-on-surface-variant max-w-md mx-auto">
                      Set <code className="text-primary bg-primary/10 px-1.5 py-0.5 rounded">NEXT_PUBLIC_CALENDLY_URL</code> to your real Calendly
                      event link (e.g. <code className="text-primary bg-primary/10 px-1.5 py-0.5 rounded">https://calendly.com/YOUR_USERNAME/your-event-type</code>)
                      to enable scheduling.
                    </p>
                  </div>
                )}
                {submitting && <p className="text-[13px] text-primary animate-pulse">Submitting your discovery + meeting details...</p>}
                {error && <p className="text-[13px] text-error bg-error-container/20 border border-error/30 rounded-lg p-3">{error}</p>}
                <button onClick={() => setStep(1)} className="text-[13px] text-on-surface-variant underline">← Back to form</button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default DiscoveryPage;
