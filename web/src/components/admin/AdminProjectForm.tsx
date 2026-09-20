"use client";

import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { submitProject } from "@/lib/api";
import { hasNoSqlInjection, purify, toSafeString } from "@/lib/sanitize";
import {
  MAX_IMAGE_BYTES,
  MAX_PROJECT_IMAGES,
  adminProjectSchema,
  parseTechStack,
  type AdminProjectInput,
} from "@/schemas/project";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { FormAlert } from "@/components/ui/FormAlert";
import { Input } from "@/components/ui/Input";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { Textarea } from "@/components/ui/Textarea";

type FormStatus = "idle" | "submitting" | "success" | "error";
type FieldErrors = Partial<Record<keyof AdminProjectInput, string>>;

const EMPTY: AdminProjectInput = {
  adminSecret: "",
  title: "",
  description: "",
  imageUrl: "",
  techStackInput: "",
  demoUrl: "",
  githubUrl: "",
};

export const AdminProjectForm = () => {
  const [form, setForm] = useState<AdminProjectInput>(EMPTY);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<FormStatus>("idle");
  const [message, setMessage] = useState<string>("");

  const techPreview = useMemo(() => parseTechStack(form.techStackInput), [form.techStackInput]);
  const submitting = status === "submitting";

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name as keyof AdminProjectInput]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleFiles = (e: ChangeEvent<HTMLInputElement>): void => {
    const selected = Array.from(e.target.files ?? []).filter((f) => f.type.startsWith("image/"));
    const tooBig = selected.filter((f) => f.size > MAX_IMAGE_BYTES);
    const next = [...files, ...selected].slice(0, MAX_PROJECT_IMAGES);

    if (tooBig.length > 0) {
      setFieldErrors((prev) => ({ ...prev, imageUrl: `Some images exceed 5MB and were skipped (${tooBig.length}).` }));
    }
    setFiles(next);
    setPreviews((prev) => {
      prev.forEach((url) => URL.revokeObjectURL(url));
      return next.map((f) => URL.createObjectURL(f));
    });
  };

  const removeFile = (index: number): void => {
    setFiles((prev) => {
      const next = prev.filter((_, i) => i !== index);
      setPreviews((old) => {
        URL.revokeObjectURL(old[index] ?? "");
        return next.map((f, i) => old[i] ?? URL.createObjectURL(f));
      });
      return next;
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setStatus("submitting");
    setMessage("");
    setFieldErrors({});

    const parsed = adminProjectSchema.safeParse(form);
    if (!parsed.success) {
      const errors: FieldErrors = {};
      parsed.error.issues.forEach((issue) => {
        const key = issue.path[0] as keyof AdminProjectInput | undefined;
        if (key && !errors[key]) errors[key] = issue.message;
      });
      setFieldErrors(errors);
      setMessage(parsed.error.issues.map((i) => `${String(i.path[0])}: ${i.message}`).join(", "));
      setStatus("error");
      return;
    }

    const techStack = parseTechStack(parsed.data.techStackInput);
    if (techStack.length === 0) {
      setFieldErrors({ techStackInput: "Add at least one technology (comma separated)" });
      setMessage("techStackInput: Add at least one technology (comma separated)");
      setStatus("error");
      return;
    }

    if (!parsed.data.imageUrl && files.length === 0) {
      setFieldErrors({ imageUrl: "Provide an image URL or upload at least one image" });
      setMessage("imageUrl: Image is required - provide imageUrl or upload at least one image");
      setStatus("error");
      return;
    }

    const payload = {
      title: purify(parsed.data.title),
      description: purify(parsed.data.description),
      imageUrl: purify(parsed.data.imageUrl ?? ""),
      techStack: techStack.map((t) => purify(t)),
      demoUrl: purify(parsed.data.demoUrl ?? ""),
      githubUrl: purify(parsed.data.githubUrl ?? ""),
    };

    if (hasNoSqlInjection(payload.title, payload.description, payload.imageUrl)) {
      setMessage("Invalid content detected.");
      setStatus("error");
      return;
    }

    try {
      const res = await submitProject(payload, files, parsed.data.adminSecret);
      setStatus("success");
      setMessage(res.message || "Project created. It now appears in the Work section.");
      setForm((prev) => ({ ...EMPTY, adminSecret: prev.adminSecret }));
      setFiles([]);
      setPreviews((prev) => {
        prev.forEach((url) => URL.revokeObjectURL(url));
        return [];
      });
    } catch (err: unknown) {
      const msg = toSafeString(err);
      console.error("[AdminProjectForm] submit failed:", msg);
      setMessage(msg || "Failed to create project. Check password / connection and retry.");
      setStatus("error");
    }
  };

  return (
    <Card intent="elevated" className="p-8 md:p-10 shadow-2xl">
      <form className="space-y-6" onSubmit={handleSubmit} noValidate>
        <Field id="admin-secret" label="Admin password" error={fieldErrors.adminSecret} hint="Stored as ADMIN_SECRET on the server. Never share publicly.">
          <Input
            id="admin-secret"
            name="adminSecret"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            required
            value={form.adminSecret}
            onChange={handleChange}
            disabled={submitting}
            maxLength={200}
            invalid={Boolean(fieldErrors.adminSecret)}
          />
        </Field>

        <Field id="admin-title" label="Title" error={fieldErrors.title}>
          <Input
            id="admin-title"
            name="title"
            type="text"
            placeholder="Sheno Commerce"
            required
            value={form.title}
            onChange={handleChange}
            disabled={submitting}
            maxLength={100}
            invalid={Boolean(fieldErrors.title)}
          />
        </Field>

        <Field id="admin-description" label="Description" error={fieldErrors.description} hint="10–1000 characters. Shown on the project card.">
          <Textarea
            id="admin-description"
            name="description"
            placeholder="High-performance headless commerce with 99.9% uptime..."
            required
            rows={4}
            value={form.description}
            onChange={handleChange}
            disabled={submitting}
            maxLength={1000}
            invalid={Boolean(fieldErrors.description)}
          />
        </Field>

        <Field
          id="admin-imageUrl"
          label="Cover image URL (optional if uploading)"
          error={fieldErrors.imageUrl}
          hint="https://... — if you upload files, the first upload becomes the cover automatically."
        >
          <Input
            id="admin-imageUrl"
            name="imageUrl"
            type="url"
            inputMode="url"
            placeholder="https://cdn.shenodev.tech/projects/commerce.jpg"
            value={form.imageUrl}
            onChange={handleChange}
            disabled={submitting}
            maxLength={500}
            invalid={Boolean(fieldErrors.imageUrl)}
          />
        </Field>

        <Field
          id="admin-images"
          label={`Upload images (Cloudinary folder: shenoprojects, max ${MAX_PROJECT_IMAGES})`}
          hint="Images only, 5MB each. First image becomes the card cover."
        >
          <input
            id="admin-images"
            type="file"
            accept="image/*"
            multiple
            onChange={handleFiles}
            disabled={submitting}
            className="w-full text-body-sm text-on-surface-variant file:mr-4 file:px-4 file:py-2.5 file:rounded-lg file:border-0 file:bg-primary-container file:text-on-primary-container file:font-semibold hover:file:bg-primary file:cursor-pointer cursor-pointer"
          />
          {previews.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 pt-3">
              {previews.map((src, i) => (
                <div key={`${src}-${i}`} className="relative group rounded-lg overflow-hidden border border-outline-variant/30 bg-surface-container-lowest">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`Upload preview ${i + 1}`} className="h-20 w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    disabled={submitting}
                    aria-label={`Remove image ${i + 1}`}
                    className="absolute top-1 right-1 rounded-full bg-background/80 px-2 py-0.5 text-xs text-on-surface hover:bg-error hover:text-white transition-colors"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </Field>

        <Field id="admin-tech" label="Tech stack (comma separated)" error={fieldErrors.techStackInput} hint="e.g. Next.js, Node.js, MongoDB">
          <Input
            id="admin-tech"
            name="techStackInput"
            type="text"
            placeholder="Next.js, Node.js, MongoDB"
            required
            value={form.techStackInput}
            onChange={handleChange}
            disabled={submitting}
            maxLength={500}
            invalid={Boolean(fieldErrors.techStackInput)}
          />
          {techPreview.length > 0 && (
            <ul className="flex flex-wrap gap-2 pt-2" aria-label="Tech preview">
              {techPreview.map((tech) => (
                <li
                  key={tech}
                  className="px-2.5 py-1 rounded-full bg-surface-container-high border border-outline-variant/30 text-label-sm font-medium text-on-surface-variant"
                >
                  {tech}
                </li>
              ))}
            </ul>
          )}
        </Field>

        <div className="grid sm:grid-cols-2 gap-6">
          <Field id="admin-demo" label="Demo URL (optional)" error={fieldErrors.demoUrl}>
            <Input
              id="admin-demo"
              name="demoUrl"
              type="url"
              inputMode="url"
              placeholder="https://demo.shenodev.tech/..."
              value={form.demoUrl}
              onChange={handleChange}
              disabled={submitting}
              maxLength={500}
              invalid={Boolean(fieldErrors.demoUrl)}
            />
          </Field>
          <Field id="admin-github" label="GitHub URL (optional)" error={fieldErrors.githubUrl}>
            <Input
              id="admin-github"
              name="githubUrl"
              type="url"
              inputMode="url"
              placeholder="https://github.com/..."
              value={form.githubUrl}
              onChange={handleChange}
              disabled={submitting}
              maxLength={500}
              invalid={Boolean(fieldErrors.githubUrl)}
            />
          </Field>
        </div>

        {status === "success" && <FormAlert tone="success">{message}</FormAlert>}
        {status === "error" && <FormAlert tone="error">{message || "Failed to create project."}</FormAlert>}

        <Button type="submit" size="lg" className="w-full py-4 cursor-pointer" disabled={submitting}>
          {submitting ? "Uploading..." : "Publish project"}
          <MaterialIcon name="cloud_upload" className="text-lg" />
        </Button>
      </form>
    </Card>
  );
};
