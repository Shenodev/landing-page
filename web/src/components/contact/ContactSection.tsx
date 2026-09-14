"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { contactSchema, type ContactInput } from "@/schemas/contact";
import { submitContact } from "@/lib/api";
import { hasNoSqlInjection, purify, toSafeString } from "@/lib/sanitize";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { FormAlert } from "@/components/ui/FormAlert";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { SectionBadge } from "@/components/ui/SectionBadge";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Textarea } from "@/components/ui/Textarea";
import { Input } from "@/components/ui/Input";

type FormStatus = "idle" | "submitting" | "success" | "error";

type FieldErrors = Partial<Record<keyof ContactInput, string>>;

const toFieldErrors = (issues: { path: (string | number | symbol)[]; message: string }[]): FieldErrors => {
  const errors: FieldErrors = {};
  issues.forEach((issue) => {
    const key = issue.path[0] as keyof ContactInput | undefined;
    if (key) errors[key] = issue.message;
  });
  return errors;
};

export const ContactSection = () => {
  const [formData, setFormData] = useState<ContactInput>({
    name: "",
    email: "",
    details: "",
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const submitting = status === "submitting";

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name as keyof ContactInput]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");
    setFieldErrors({});

    const parsed = contactSchema.safeParse(formData);
    if (!parsed.success) {
      setFieldErrors(toFieldErrors(parsed.error.issues));
      setErrorMsg(parsed.error.issues.map((i) => `${String(i.path[0])}: ${i.message}`).join(", "));
      setStatus("error");
      return;
    }

    const purified: ContactInput = {
      name: purify(parsed.data.name),
      email: purify(parsed.data.email).toLowerCase(),
      details: purify(parsed.data.details),
    };

    if (hasNoSqlInjection(purified.name, purified.details)) {
      setErrorMsg("Invalid content detected.");
      setStatus("error");
      return;
    }

    try {
      await submitContact(purified);
      setStatus("success");
      setFormData({ name: "", email: "", details: "" });
      setTimeout(() => setStatus("idle"), 4000);
    } catch (err: unknown) {
      const msg = toSafeString(err);
      console.error("[ContactSection] Submission error (purified):", msg, err);
      setErrorMsg("Network error. Please check connection and retry.");
      setStatus("error");
    }
  };

  return (
    <section className="py-24 max-w-[1320px] mx-auto px-6 md:px-12" id="contact">
      <div className="max-w-2xl mx-auto">
        <SectionHeading
          badge={<SectionBadge>Direct Engineering Line</SectionBadge>}
          title="Let&apos;s Build Something Extraordinary"
          subtitle="Reach out directly with your parameters. We respond with a comprehensive architectural review and timeline within 24 hours."
          className="mb-10"
        />

        <Card intent="elevated" className="relative p-8 md:p-10 shadow-2xl">
          <div className="absolute top-0 left-12 right-12 h-px bg-gradient-to-r from-transparent via-primary-container/40 to-transparent" />

          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <Field
              id="contact-name"
              label="Full Name"
              error={fieldErrors.name}
            >
              <Input
                id="contact-name"
                name="name"
                placeholder="Alex Vance"
                required
                type="text"
                value={formData.name}
                onChange={handleChange}
                disabled={submitting}
                aria-label="Full Name"
                maxLength={100}
                invalid={Boolean(fieldErrors.name)}
              />
            </Field>

            <Field
              id="contact-email"
              label="Work Email"
              error={fieldErrors.email}
            >
              <Input
                id="contact-email"
                name="email"
                placeholder="alex@enterprise.com"
                required
                type="email"
                value={formData.email}
                onChange={handleChange}
                disabled={submitting}
                aria-label="Work Email"
                maxLength={200}
                invalid={Boolean(fieldErrors.email)}
              />
            </Field>

            <Field id="contact-details" label="Project Details" error={fieldErrors.details}>
              <Textarea
                id="contact-details"
                name="details"
                placeholder="Detail your operational scope, target stack, timeline expectations, or system requirements..."
                required
                rows={4}
                value={formData.details}
                onChange={handleChange}
                disabled={submitting}
                aria-label="Project Details"
                maxLength={1000}
                invalid={Boolean(fieldErrors.details)}
              />
            </Field>

            <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-lg bg-surface-container-lowest/50 border border-outline-variant/20">
              <MaterialIcon name="bolt" className="text-primary text-base" />
              <span className="text-body-sm text-on-surface-variant">
                Automated Welcome Email Powered by Resend API • Zod + DOMPurify
              </span>
            </div>

            {status === "success" && (
              <FormAlert tone="success">✓ Message sent successfully! We&apos;ll respond within 24 hours.</FormAlert>
            )}
            {status === "error" && (
              <FormAlert tone="error">{errorMsg || "Failed to send message. Please try again."}</FormAlert>
            )}

            <Button type="submit" size="lg" className="w-full py-4 cursor-pointer" disabled={submitting}>
              {submitting ? "Sending..." : "Send Message / Get Started"}
              <MaterialIcon name="send" className="text-lg" />
            </Button>
          </form>
        </Card>
      </div>
    </section>
  );
};