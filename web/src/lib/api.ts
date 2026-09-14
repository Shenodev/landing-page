import { toSafeString } from "@/lib/sanitize";

export type Project = {
  _id: string;
  title: string;
  description: string;
  imageUrl: string;
  techStack: string[];
  demoUrl?: string;
  githubUrl?: string;
};

export type ContactPayload = {
  name: string;
  email: string;
  details: string;
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
  const res = await fetch(`${getApiUrl()}/api/projects`, { cache: "no-store" });
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
    Object.entries(payload).forEach(([key, value]) => body.append(key, value));
    files.forEach((file) => body.append("attachments", file));
    return fetchJson(url, { method: "POST", body });
  }

  return fetchJson(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
};

export { toSafeString };