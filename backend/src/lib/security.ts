import crypto from "crypto";

/**
 * Timing-safe string comparison for shared secrets.
 * Falls back to false on length mismatch without leaking prefix info
 * beyond length (lengths of secrets are not considered sensitive here).
 */
export const timingSafeCompare = (a: string, b: string): boolean => {
  const bufA: Buffer = Buffer.from(a, "utf8");
  const bufB: Buffer = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) {
    // Compare against self to keep timing flat, then fail.
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
};

/** Mask an email for logs: "ge***@example.com". Never logs full PII. */
export const maskEmail = (email: string | null | undefined): string => {
  if (!email || typeof email !== "string" || !email.includes("@")) return "[redacted]";
  const [local, domain] = email.split("@") as [string, string];
  const head: string = local.slice(0, 2);
  return `${head}***@${domain}`;
};

/**
 * Strip CR/LF + trim for values interpolated into email subjects.
 * Prevents header-injection via Resend subject lines.
 */
export const sanitizeSubject = (value: string, maxLen = 120): string =>
  value.replace(/[\r\n]+/g, " ").trim().slice(0, maxLen);

type MagicSignature = { mime: string; bytes: number[]; offset?: number };

const IMAGE_SIGNATURES: readonly MagicSignature[] = [
  { mime: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  { mime: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { mime: "image/gif", bytes: [0x47, 0x49, 0x46, 0x38] },
  { mime: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 }, // RIFF....WEBP
  { mime: "application/pdf", bytes: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  { mime: "application/zip", bytes: [0x50, 0x4b, 0x03, 0x04] }, // PK..
];

const matchesSignature = (buffer: Buffer, sig: MagicSignature): boolean => {
  const off: number = sig.offset ?? 0;
  if (buffer.length < off + sig.bytes.length + 4) return false;
  const head: number[] = Array.from(buffer.subarray(off, off + sig.bytes.length));
  const matches: boolean = sig.bytes.every((b, i) => head[i] === b);
  if (!matches) return false;
  if (sig.mime === "image/webp") {
    // WEBP marker at offset 8
    return buffer.length >= 12 && buffer.subarray(8, 12).toString("ascii") === "WEBP";
  }
  return true;
};

/**
 * Verify a file buffer's magic bytes match its claimed MIME type.
 * Multer's fileFilter only checks the client-supplied mimetype header,
 * which attackers control — magic bytes verify actual content.
 * Returns true when the buffer matches one of the allowed MIMEs.
 */
export const hasValidFileSignature = (buffer: Buffer, claimedMime: string, allowedMimes: readonly string[]): boolean => {
  if (!buffer || buffer.length < 12) return false;
  if (!allowedMimes.includes(claimedMime)) return false;
  const sigs: MagicSignature[] = IMAGE_SIGNATURES.filter((s) => allowedMimes.includes(s.mime));
  // For msword/docx without reliable magic bytes, accept by allowlist only
  // when the buffer is non-empty (Cloudinary re-validates server-side).
  if (claimedMime === "application/msword" || claimedMime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    return buffer.length > 12;
  }
  return sigs.some((s) => s.mime === claimedMime && matchesSignature(buffer, s));
};
