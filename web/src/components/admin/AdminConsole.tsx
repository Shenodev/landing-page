"use client";

import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import {
  ApiError,
  deleteProject,
  fetchProjectsAdmin,
  updateProject,
  type AdminProjectPayload,
  type Project,
} from "@/lib/api";
import { hasNoSqlInjection, purify, toSafeString } from "@/lib/sanitize";
import {
  MAX_IMAGE_BYTES,
  MAX_PROJECT_IMAGES,
  adminProjectSchema,
  parseTechStack,
} from "@/schemas/project";
import { AdminProjectForm } from "@/components/admin/AdminProjectForm";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { FormAlert } from "@/components/ui/FormAlert";
import { Input } from "@/components/ui/Input";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Textarea } from "@/components/ui/Textarea";

// NOTE: the admin secret lives only in React memory state. It is sent
// per-request in the x-admin-secret header and never persisted to
// localStorage / sessionStorage / cookies.

type Tab = "list" | "add";

export const AdminConsole = () => {
  const [secret, setSecret] = useState<string | null>(null);
  const [gatePassword, setGatePassword] = useState("");
  const [gateError, setGateError] = useState("");
  const [tab, setTab] = useState<Tab>("list");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState("");
  const [notice, setNotice] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const lock = useCallback((message?: string) => {
    setSecret(null);
    setProjects([]);
    setTab("list");
    setGatePassword("");
    setGateError(message ?? "");
  }, []);

  const reload = useCallback((): void => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    if (!secret) return;
    let cancelled = false;
    setLoading(true);
    setListError("");
    fetchProjectsAdmin(secret)
      .then((list) => {
        if (!cancelled) setProjects(list);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          lock("Wrong password. Please try again.");
          return;
        }
        setListError(toSafeString(err) || "Failed to load projects.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [secret, reloadKey, lock]);

  const unlock = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (!gatePassword.trim()) {
      setGateError("Enter the admin password.");
      return;
    }
    setGateError("");
    setNotice("");
    setSecret(gatePassword);
  };

  if (!secret) {
    return (
      <main id="main-content" className="py-24 max-w-[520px] mx-auto px-6 md:px-12">
        <SectionHeading
          title="Admin"
          subtitle="Hidden area — not linked anywhere. Enter the password to manage portfolio projects."
          className="mb-10"
        />
        <Card intent="elevated" className="p-8 shadow-2xl">
          <form className="space-y-5" onSubmit={unlock} noValidate>
            <Field id="gate-password" label="Admin password">
              <Input
                id="gate-password"
                name="gatePassword"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                required
                value={gatePassword}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setGatePassword(e.target.value)}
                maxLength={200}
              />
            </Field>
            {gateError && <FormAlert tone="error">{gateError}</FormAlert>}
            <Button type="submit" size="lg" className="w-full py-4 cursor-pointer">
              Unlock dashboard
              <MaterialIcon name="lock_open" className="text-lg" />
            </Button>
          </form>
        </Card>
      </main>
    );
  }

  return (
    <main id="main-content" className="py-24 max-w-[880px] mx-auto px-6 md:px-12">
      <SectionHeading
        title="Project dashboard"
        subtitle="Add, edit, or remove portfolio projects. Changes appear in the Work section within a minute."
        className="mb-8"
      />
      {notice && (
        <div className="mb-6">
          <FormAlert tone="success">{notice}</FormAlert>
        </div>
      )}
      <div className="flex items-center gap-3 mb-8" role="tablist" aria-label="Admin sections">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "list"}
          onClick={() => setTab("list")}
          className={`px-5 py-2.5 rounded-lg text-body-sm font-semibold transition-colors cursor-pointer ${
            tab === "list"
              ? "bg-primary-container text-on-primary-container"
              : "bg-surface-container-high text-on-surface-variant hover:text-on-surface"
          }`}
        >
          Projects ({projects.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "add"}
          onClick={() => setTab("add")}
          className={`px-5 py-2.5 rounded-lg text-body-sm font-semibold transition-colors cursor-pointer ${
            tab === "add"
              ? "bg-primary-container text-on-primary-container"
              : "bg-surface-container-high text-on-surface-variant hover:text-on-surface"
          }`}
        >
          Add new
        </button>
        <span className="flex-1" />
        <button
          type="button"
          onClick={() => lock()}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-body-sm font-medium text-on-surface-variant hover:text-error transition-colors cursor-pointer"
        >
          <MaterialIcon name="lock" className="text-base" /> Lock
        </button>
      </div>

      {tab === "add" ? (
        <AdminProjectForm
          fixedSecret={secret}
          onSaved={() => {
            setNotice("Project published.");
            setTab("list");
            reload();
          }}
          onUnauthorized={() => lock("Wrong password. Please try again.")}
        />
      ) : loading ? (
        <Card className="p-10 text-center text-on-surface-variant">Loading projects…</Card>
      ) : listError ? (
        <FormAlert tone="error">{listError}</FormAlert>
      ) : projects.length === 0 ? (
        <Card className="p-10 text-center text-on-surface-variant">
          No projects yet. Use “Add new” to publish the first one.
        </Card>
      ) : (
        <div className="space-y-4">
          {projects.map((project) => (
            <ProjectRow
              key={project._id}
              project={project}
              secret={secret}
              onChanged={(msg) => {
                setNotice(msg);
                reload();
              }}
              onUnauthorized={() => lock("Wrong password. Please try again.")}
            />
          ))}
        </div>
      )}
    </main>
  );
};

const ProjectRow = ({
  project,
  secret,
  onChanged,
  onUnauthorized,
}: {
  project: Project;
  secret: string;
  onChanged: (message: string) => void;
  onUnauthorized: () => void;
}) => {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const remove = async (): Promise<void> => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setBusy(true);
    setError("");
    try {
      await deleteProject(project._id, secret);
      setConfirming(false);
      onChanged(`“${project.title}” deleted.`);
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 401) {
        onUnauthorized();
        return;
      }
      setError(toSafeString(err) || "Delete failed. Please retry.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="p-5">
      <div className="flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={project.imageUrl}
          alt=""
          className="h-14 w-20 shrink-0 rounded-lg object-cover bg-surface-container-lowest"
          loading="lazy"
        />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-on-surface truncate">{project.title}</p>
          <p className="text-body-sm text-on-surface-variant truncate">
            {(project.techStack ?? []).join(" · ")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditing((v) => !v);
            setConfirming(false);
            setError("");
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-body-sm font-semibold bg-surface-container-high hover:bg-surface-container-highest text-on-surface transition-colors cursor-pointer"
        >
          <MaterialIcon name="edit" className="text-base" /> {editing ? "Close" : "Edit"}
        </button>
        <button
          type="button"
          onClick={() => void remove()}
          disabled={busy}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-body-sm font-semibold transition-colors cursor-pointer disabled:opacity-60 ${
            confirming ? "bg-error text-white hover:opacity-90" : "text-error hover:bg-error-container/20"
          }`}
        >
          <MaterialIcon name="delete" className="text-base" /> {confirming ? (busy ? "Deleting…" : "Confirm delete") : "Delete"}
        </button>
      </div>
      {confirming && !busy && (
        <p className="mt-3 text-body-sm text-error" role="alert">
          This permanently removes “{project.title}” and its gallery images. Click confirm delete again to proceed, or edit to cancel.
        </p>
      )}
      {error && (
        <div className="mt-3">
          <FormAlert tone="error">{error}</FormAlert>
        </div>
      )}
      {editing && (
        <div className="mt-5 border-t border-outline-variant/30 pt-5">
          <ProjectEditForm
            project={project}
            secret={secret}
            onSaved={() => {
              setEditing(false);
              onChanged(`“${project.title}” updated.`);
            }}
            onUnauthorized={onUnauthorized}
          />
        </div>
      )}
    </Card>
  );
};

type EditErrors = Partial<Record<"title" | "description" | "imageUrl" | "techStackInput" | "demoUrl" | "githubUrl", string>>;

const ProjectEditForm = ({
  project,
  secret,
  onSaved,
  onUnauthorized,
}: {
  project: Project;
  secret: string;
  onSaved: () => void;
  onUnauthorized: () => void;
}) => {
  const [title, setTitle] = useState(project.title);
  const [description, setDescription] = useState(project.description);
  const [imageUrl, setImageUrl] = useState(project.imageUrl);
  const [techStackInput, setTechStackInput] = useState((project.techStack ?? []).join(", "));
  const [demoUrl, setDemoUrl] = useState(project.demoUrl ?? "");
  const [githubUrl, setGithubUrl] = useState(project.githubUrl ?? "");
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<EditErrors>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [message, setMessage] = useState("");

  const techPreview = useMemo(() => parseTechStack(techStackInput), [techStackInput]);
  const submitting = status === "submitting";
  const storedImageCount: number = project.images?.length ?? (project.imageUrl ? 1 : 0);

  const save = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setStatus("submitting");
    setMessage("");
    setErrors({});

    const parsed = adminProjectSchema.safeParse({
      adminSecret: secret,
      title,
      description,
      imageUrl,
      techStackInput,
      demoUrl,
      githubUrl,
    });
    if (!parsed.success) {
      const next: EditErrors = {};
      parsed.error.issues.forEach((issue) => {
        const key = issue.path[0] as keyof EditErrors | "adminSecret" | undefined;
        if (key && key !== "adminSecret" && !next[key as keyof EditErrors]) {
          next[key as keyof EditErrors] = issue.message;
        }
      });
      // Image may be kept from the stored gallery — only flag when truly imageless.
      if (next.imageUrl && (files.length > 0 || storedImageCount > 0)) {
        delete next.imageUrl;
      }
      if (Object.keys(next).length > 0) {
        setErrors(next);
        setMessage("Please fix the highlighted fields.");
        setStatus("error");
        return;
      }
    }

    const techStack = parseTechStack(techStackInput);
    if (techStack.length === 0) {
      setErrors({ techStackInput: "Add at least one technology (comma separated)" });
      setMessage("Add at least one technology (comma separated).");
      setStatus("error");
      return;
    }
    if (!imageUrl.trim() && files.length === 0 && storedImageCount === 0) {
      setErrors({ imageUrl: "Keep the image URL, upload a replacement, or the project has no cover." });
      setMessage("A cover image is required.");
      setStatus("error");
      return;
    }

    const payload: AdminProjectPayload = {
      title: purify(title.trim()),
      description: purify(description.trim()),
      imageUrl: purify(imageUrl.trim()),
      techStack: techStack.map((t) => purify(t)),
      demoUrl: purify(demoUrl.trim()),
      githubUrl: purify(githubUrl.trim()),
    };
    if (hasNoSqlInjection(payload.title, payload.description, payload.imageUrl)) {
      setMessage("Invalid content detected.");
      setStatus("error");
      return;
    }

    try {
      const res = await updateProject(project._id, payload, files, secret);
      setStatus("idle");
      setMessage(res.message);
      onSaved();
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 401) {
        onUnauthorized();
        return;
      }
      setMessage(toSafeString(err) || "Update failed. Please retry.");
      setStatus("error");
    }
  };

  const onFiles = (e: ChangeEvent<HTMLInputElement>): void => {
    const selected = Array.from(e.target.files ?? []).filter(
      (f) => f.type.startsWith("image/") && f.type !== "image/svg+xml",
    );
    const ok = selected.filter((f) => f.size <= MAX_IMAGE_BYTES);
    setFiles([...files, ...ok].slice(0, MAX_PROJECT_IMAGES));
  };

  return (
    <form className="space-y-5" onSubmit={(e) => void save(e)} noValidate>
      <div className="grid sm:grid-cols-2 gap-5">
        <Field id={`edit-title-${project._id}`} label="Title" error={errors.title}>
          <Input id={`edit-title-${project._id}`} name="title" value={title} onChange={(e) => setTitle(e.target.value)} disabled={submitting} maxLength={100} invalid={Boolean(errors.title)} />
        </Field>
        <Field id={`edit-tech-${project._id}`} label="Tech stack (comma separated)" error={errors.techStackInput}>
          <Input id={`edit-tech-${project._id}`} name="techStackInput" value={techStackInput} onChange={(e) => setTechStackInput(e.target.value)} disabled={submitting} maxLength={500} invalid={Boolean(errors.techStackInput)} />
        </Field>
      </div>
      {techPreview.length > 0 && (
        <p className="text-body-sm text-on-surface-variant -mt-2">Will save as: {techPreview.join(" · ")}</p>
      )}
      <Field id={`edit-desc-${project._id}`} label="Description" error={errors.description}>
        <Textarea id={`edit-desc-${project._id}`} name="description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} disabled={submitting} maxLength={1000} invalid={Boolean(errors.description)} />
      </Field>
      <Field id={`edit-img-${project._id}`} label="Cover image URL" error={errors.imageUrl} hint={storedImageCount > 0 ? `Stored gallery kept (${storedImageCount} image${storedImageCount === 1 ? "" : "s"}) unless you replace it below.` : undefined}>
        <Input id={`edit-img-${project._id}`} name="imageUrl" type="url" inputMode="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} disabled={submitting} maxLength={500} invalid={Boolean(errors.imageUrl)} />
      </Field>
      <Field id={`edit-files-${project._id}`} label="Replace gallery (optional upload)">
        <input
          id={`edit-files-${project._id}`}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          onChange={onFiles}
          disabled={submitting}
          className="w-full text-body-sm text-on-surface-variant file:mr-4 file:px-4 file:py-2.5 file:rounded-lg file:border-0 file:bg-primary-container file:text-on-primary-container file:font-semibold hover:file:bg-primary file:cursor-pointer cursor-pointer"
        />
        {files.length > 0 && <p className="text-body-sm text-on-surface-variant pt-2">{files.length} new image{files.length === 1 ? "" : "s"} will replace the gallery.</p>}
      </Field>
      <div className="grid sm:grid-cols-2 gap-5">
        <Field id={`edit-demo-${project._id}`} label="Demo URL (optional)" error={errors.demoUrl}>
          <Input id={`edit-demo-${project._id}`} name="demoUrl" type="url" inputMode="url" value={demoUrl} onChange={(e) => setDemoUrl(e.target.value)} disabled={submitting} maxLength={500} invalid={Boolean(errors.demoUrl)} />
        </Field>
        <Field id={`edit-github-${project._id}`} label="GitHub URL (optional)" error={errors.githubUrl}>
          <Input id={`edit-github-${project._id}`} name="githubUrl" type="url" inputMode="url" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} disabled={submitting} maxLength={500} invalid={Boolean(errors.githubUrl)} />
        </Field>
      </div>
      {message && status === "error" && <FormAlert tone="error">{message}</FormAlert>}
      {message && status === "idle" && <FormAlert tone="success">{message}</FormAlert>}
      <Button type="submit" size="md" className="cursor-pointer" disabled={submitting}>
        {submitting ? "Saving…" : "Save changes"}
        <MaterialIcon name="check" className="text-lg" />
      </Button>
    </form>
  );
};
