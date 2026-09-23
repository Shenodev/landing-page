import { toSafeString } from "@/lib/sanitize";

export type ProjectImage = {
  url: string;
  publicId?: string;
};

export type Project = {
  _id: string;
  title: string;
  description: string;
  imageUrl: string;
  images?: ProjectImage[];
  techStack: string[];
  demoUrl?: string;
  githubUrl?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ContactPayload = {
  name: string;
  email: string;
  details: string;
  privacyConsent: true;
  ageConfirmed: true;
};

export type DiscoveryPayload = {
  fullName: string;
  companyName: string;
  email: string;
  phone: string;
  businessDesc: string;
  targetAudience: string;
  competitors: string;
  brandStatus: string;
  references: string;
  dislikes: string;
  targetPackage: string;
  requiredFeatures: string;
  integrations: string;
  launchDate: string;
  extraDetails: string;
  privacyConsent: true;
  ageConfirmed: true;
  meetingDate: string;
  meetingTime: string;
  meetingUrl: string;
  calendlyEventUri: string;
  calendlyEventUrl: string;
};

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const getApiUrl = (): string => {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_API_URL not configured");
  }
  return url.replace(/\/$/, "");
};

const readErrorMessage = async (res: Response): Promise<string> => {
  const data = (await res
    .json()
    .catch(() => ({ message: `Server responded with ${res.status}` }))) as {
    message?: string;
    error?: string;
  };
  return data.message || data.error || `Server responded with ${res.status}`;
};

const fetchJson = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const res = await fetch(url, init);
  if (!res.ok) {
    throw new ApiError(await readErrorMessage(res), res.status);
  }
  return (await res.json()) as T;
};

export const fetchProjects = async (): Promise<Project[]> => {
  // No `cache: "no-store"` on purpose: the API sends
  // `Cache-Control: public, max-age=30, s-maxage=60, stale-while-revalidate=300`,
  // so browsers and CDNs serve the shared list without hitting MongoDB.
  // (Admin reads use fetchProjectsAdmin with no-store instead.)
  const res = await fetch(`${getApiUrl()}/api/projects`);
  if (!res.ok) {
    throw new ApiError(await readErrorMessage(res), res.status);
  }
  const data = (await res.json()) as { data: Project[] } | Project[];
  return Array.isArray(data) ? data : (data.data ?? []);
};

export const submitContact = async (payload: ContactPayload): Promise<{ message: string }> =>
  fetchJson(`${getApiUrl()}/api/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

export const submitDiscovery = async (
  payload: DiscoveryPayload,
  files: readonly File[],
): Promise<{ message: string }> => {
  const url = `${getApiUrl()}/api/discovery`;

  if (files.length > 0) {
    const body = new FormData();
    // FormData carries text only: stringify booleans/arrays. The API parses
    // techStack JSON and normalizes "true"/"false" consent flags server-side.
    Object.entries(payload).forEach(([key, value]) =>
      body.append(key, typeof value === "string" ? value : JSON.stringify(value)),
    );
    files.forEach((file) => body.append("attachments", file));
    return fetchJson(url, { method: "POST", body });
  }

  return fetchJson(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
};

export type AdminProjectPayload = {
  title: string;
  description: string;
  imageUrl: string;
  techStack: string[];
  demoUrl: string;
  githubUrl: string;
};

export type SubmitProjectResult = {
  message: string;
  data?: unknown;
};

/**
 * Hidden admin upload — POST /api/projects with x-admin-secret.
 * Files (field "images") are uploaded server-side to Cloudinary folder "shenoprojects".
 * When files are present, other fields go as FormData text (techStack as JSON string).
 */
export const submitProject = async (
  payload: AdminProjectPayload,
  files: readonly File[],
  adminSecret: string,
): Promise<SubmitProjectResult> => {
  const url = `${getApiUrl()}/api/projects`;
  const headers = { "x-admin-secret": adminSecret };

  if (files.length > 0) {
    const body = new FormData();
    body.append("title", payload.title);
    body.append("description", payload.description);
    body.append("imageUrl", payload.imageUrl);
    body.append("techStack", JSON.stringify(payload.techStack));
    body.append("demoUrl", payload.demoUrl);
    body.append("githubUrl", payload.githubUrl);
    files.forEach((file) => body.append("images", file));
    return fetchJson(url, { method: "POST", headers, body });
  }

  return fetchJson(url, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
};

export const requestUnsubscribe = async (email: string): Promise<{ message: string }> =>
  fetchJson(`${getApiUrl()}/api/unsubscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

export const requestDataDeletion = async (payload: {
  name: string;
  email: string;
  details: string;
}): Promise<{ message: string }> =>
  fetchJson(`${getApiUrl()}/api/privacy/deletion-request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

/**
 * Admin project list — always fresh (mutations must reflect immediately),
 * bypassing the public browser/CDN cache the public feed enjoys.
 */
export const fetchProjectsAdmin = async (adminSecret: string): Promise<Project[]> => {
  const res = await fetch(`${getApiUrl()}/api/projects`, {
    cache: "no-store",
    headers: { "x-admin-secret": adminSecret },
  });
  if (!res.ok) {
    throw new ApiError(await readErrorMessage(res), res.status);
  }
  const data = (await res.json()) as { data: Project[] } | Project[];
  return Array.isArray(data) ? data : (data.data ?? []);
};

export const updateProject = async (
  id: string,
  payload: AdminProjectPayload,
  files: readonly File[],
  adminSecret: string,
): Promise<SubmitProjectResult> => {
  const url = `${getApiUrl()}/api/projects/${encodeURIComponent(id)}`;
  const headers = { "x-admin-secret": adminSecret };

  if (files.length > 0) {
    const body = new FormData();
    body.append("title", payload.title);
    body.append("description", payload.description);
    body.append("imageUrl", payload.imageUrl);
    body.append("techStack", JSON.stringify(payload.techStack));
    body.append("demoUrl", payload.demoUrl);
    body.append("githubUrl", payload.githubUrl);
    files.forEach((file) => body.append("images", file));
    return fetchJson(url, { method: "PUT", headers, body });
  }

  return fetchJson(url, {
    method: "PUT",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
};

export const deleteProject = async (id: string, adminSecret: string): Promise<SubmitProjectResult> => {
  const url = `${getApiUrl()}/api/projects/${encodeURIComponent(id)}`;
  return fetchJson(url, {
    method: "DELETE",
    headers: { "x-admin-secret": adminSecret },
  });
};

export { toSafeString };