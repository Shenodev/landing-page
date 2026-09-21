"use client";

import Link from "next/link";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { requestDataDeletion } from "@/lib/api";
import { toSafeString } from "@/lib/sanitize";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { FormAlert } from "@/components/ui/FormAlert";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

type FormStatus = "idle" | "submitting" | "success" | "error";

export const PrivacyDeletionForm = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [details, setDetails] = useState("");
  const [status, setStatus] = useState<FormStatus>("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (name.trim().length < 2 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      setStatus("error");
      setMessage("Please provide your name and a valid email address.");
      return;
    }
    setStatus("submitting");
    setMessage("");
    try {
      const res = await requestDataDeletion({ name: name.trim(), email: email.trim(), details: details.trim() });
      setStatus("success");
      setMessage(res.message);
      setName("");
      setEmail("");
      setDetails("");
    } catch (err: unknown) {
      setStatus("error");
      setMessage(toSafeString(err) || "Failed to submit. Please email us instead.");
    }
  };

  const onName = (e: ChangeEvent<HTMLInputElement>): void => setName(e.target.value);
  const onEmail = (e: ChangeEvent<HTMLInputElement>): void => setEmail(e.target.value);
  const onDetails = (e: ChangeEvent<HTMLTextAreaElement>): void => setDetails(e.target.value);

  return (
    <Card intent="elevated" className="p-8 md:p-10 shadow-2xl" aria-labelledby="deletion-heading">
      <h2 id="deletion-heading" className="font-display text-title-md text-on-surface mb-2">
        Request Data Deletion
      </h2>
      <p className="text-body-sm text-on-surface-variant mb-6">
        We erase your personal data within 30 days and confirm by email. Prefer email? Write to{" "}
        <a className="text-primary hover:underline" href="mailto:hello@contact.shenodev.tech">
          hello@contact.shenodev.tech
        </a>{" "}
        or <Link className="text-primary hover:underline" href="/unsubscribe">unsubscribe from emails</Link>.
      </p>
      <form className="space-y-6" onSubmit={handleSubmit} noValidate>
        <Field id="deletion-name" label="Full Name">
          <Input id="deletion-name" name="name" type="text" autoComplete="name" placeholder="Alex Vance" required value={name} onChange={onName} disabled={status === "submitting"} maxLength={100} />
        </Field>
        <Field id="deletion-email" label="Email used in your submission">
          <Input id="deletion-email" name="email" type="email" autoComplete="email" placeholder="alex@enterprise.com" required value={email} onChange={onEmail} disabled={status === "submitting"} maxLength={200} />
        </Field>
        <Field id="deletion-details" label="Anything that helps us find your records (optional)">
          <Textarea id="deletion-details" name="details" rows={3} placeholder="Approximate date, company name..." value={details} onChange={onDetails} disabled={status === "submitting"} maxLength={1000} />
        </Field>
        {status === "success" && <FormAlert tone="success">{message}</FormAlert>}
        {status === "error" && <FormAlert tone="error">{message}</FormAlert>}
        <Button type="submit" size="lg" className="w-full py-4 cursor-pointer" disabled={status === "submitting"}>
          {status === "submitting" ? "Submitting..." : "Request Deletion"}
        </Button>
      </form>
    </Card>
  );
};
