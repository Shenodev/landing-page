"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState, type ChangeEvent, type FormEvent } from "react";
import { requestUnsubscribe } from "@/lib/api";
import { toSafeString } from "@/lib/sanitize";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { FormAlert } from "@/components/ui/FormAlert";
import { Input } from "@/components/ui/Input";
import { SectionHeading } from "@/components/ui/SectionHeading";

type FormStatus = "idle" | "submitting" | "success" | "error";

const UnsubscribeFormInner = () => {
  const params = useSearchParams();
  const prefill: string = params.get("email") ?? "";
  const [email, setEmail] = useState(prefill);
  const [status, setStatus] = useState<FormStatus>("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }
    setStatus("submitting");
    setMessage("");
    try {
      const res = await requestUnsubscribe(email.trim());
      setStatus("success");
      setMessage(res.message);
    } catch (err: unknown) {
      setStatus("error");
      setMessage(toSafeString(err) || "Failed to unsubscribe. Please try again.");
    }
  };

  const onChange = (e: ChangeEvent<HTMLInputElement>): void => setEmail(e.target.value);

  return (
    <>
      <SectionHeading
        title="Unsubscribe"
        subtitle="One click, no login, no dark patterns. Operational replies to an active inquiry may still reach you until it closes."
        className="mb-10"
      />
      <Card intent="elevated" className="p-8 md:p-10 shadow-2xl">
        <form className="space-y-6" onSubmit={handleSubmit} noValidate>
          <Field id="unsub-email" label="Email address">
            <Input
              id="unsub-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="alex@enterprise.com"
              required
              value={email}
              onChange={onChange}
              disabled={status === "submitting"}
              maxLength={200}
            />
          </Field>
          {status === "success" && <FormAlert tone="success">{message}</FormAlert>}
          {status === "error" && <FormAlert tone="error">{message}</FormAlert>}
          <Button type="submit" size="lg" className="w-full py-4 cursor-pointer" disabled={status === "submitting"}>
            {status === "submitting" ? "Working..." : "Unsubscribe me"}
          </Button>
        </form>
      </Card>
    </>
  );
};

export const UnsubscribeForm = () => (
  <Suspense>
    <UnsubscribeFormInner />
  </Suspense>
);
