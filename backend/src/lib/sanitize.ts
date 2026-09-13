/**
 * String sanitization for DOM injection prevention.
 * Strips HTML tags via regex (lightweight, Jest-safe) then trims.
 * No `any` types per rules.
 */
export const purifyString = (input: string): string => {
  // Remove script tags and their content first, then remaining HTML tags, javascript: URIs, null bytes
  const withoutScript: string = input.replace(/<script[^>]*>.*?<\/script>/gi, "");
  const withoutTags: string = withoutScript.replace(/<[^>]*>/g, "").replace(/javascript:/gi, "").replace(/\0/g, "");
  return withoutTags.trim();
};

/**
 * Escape HTML special characters for safe interpolation into HTML templates.
 * Prevents XSS when user data is interpolated into email HTML.
 */
const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export const escapeHtml = (s: string): string => s.replace(/[&<>"']/g, (m) => HTML_ESCAPES[m] ?? m);

export const purifyContactInput = (data: {
  name: string;
  email: string;
  message: string;
}): { name: string; email: string; message: string; details: string } => {
  const purified = {
    name: purifyString(data.name),
    email: purifyString(data.email).toLowerCase(),
    message: purifyString(data.message),
  };
  return { ...purified, details: purified.message };
};

/**
 * Detect NoSQL injection patterns in raw payload.
 * Rejects keys with $ or . and values with $where, $gt etc.
 */
export const hasInjectionAttempt = (obj: Record<string, unknown>): boolean => {
  const forbiddenKey = (k: string): boolean =>
    k.startsWith("$") || k.includes(".") || k.includes("__proto__");
  const forbiddenValue = (v: unknown): boolean => {
    if (typeof v === "string") {
      return v.includes("$where") || v.includes("$gt") || v.includes("$ne") || v.trim().startsWith("$");
    }
    if (v !== null && typeof v === "object") {
      const rec = v as Record<string, unknown>;
      return Object.keys(rec).some((k) => forbiddenKey(k) || forbiddenValue(rec[k]));
    }
    return false;
  };

  return Object.keys(obj).some((k) => forbiddenKey(k) || forbiddenValue(obj[k]));
};