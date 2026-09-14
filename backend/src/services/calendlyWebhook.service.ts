import crypto from "crypto";

export const CALENDLY_SIGNATURE_HEADER = "calendly-webhook-signature";
export const CALENDLY_SIGNATURE_HEADER_ALT = "x-calendly-webhook-signature";

export interface CalendlySignatureParts {
  timestamp: string;
  signature: string;
}

/**
 * Parse the Calendly webhook signature header, e.g.
 * "t=1719921600,v1=8f2d...c1a9" -> { timestamp: "1719921600", signature: "8f2d..." }.
 */
export const parseCalendlySignature = (header: string | undefined | null): CalendlySignatureParts | null => {
  if (!header) return null;
  let timestamp = "";
  let signature = "";
  for (const pair of header.split(",")) {
    const idx: number = pair.indexOf("=");
    if (idx === -1) continue;
    const key: string = pair.slice(0, idx).trim();
    const value: string = pair.slice(idx + 1).trim();
    if (key === "t" && !timestamp) timestamp = value;
    if (key === "v1" && !signature) signature = value;
  }
  if (!timestamp || !signature) return null;
  return { timestamp, signature };
};

/**
 * Verify a Calendly webhook request signature.
 * Signed content = "{timestamp}.{raw body}", HMAC-SHA256 (hex) with the
 * subscription signing key, compared timing-safely. Stale timestamps are
 * rejected within `toleranceSec` to prevent replay attacks.
 *
 * IMPORTANT: `rawBody` must be the exact bytes received (use express.raw()),
 * NOT parsed/re-serialized JSON.
 */
export const verifyCalendlySignature = (
  rawBody: string | Buffer,
  header: string | undefined | null,
  signingKey: string | undefined | null,
  toleranceSec = 180
): boolean => {
  if (!header || !signingKey) return false;
  const parsed = parseCalendlySignature(header);
  if (!parsed) return false;
  const timestamp: number = Number(parsed.timestamp);
  if (!Number.isFinite(timestamp)) return false;

  const nowSec: number = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSec - timestamp) > toleranceSec) return false;

  const body: string = typeof rawBody === "string" ? rawBody : rawBody.toString("utf8");
  const expected: string = crypto.createHmac("sha256", signingKey).update(`${parsed.timestamp}.${body}`).digest("hex");
  try {
    const a: Buffer = Buffer.from(parsed.signature, "hex");
    const b: Buffer = Buffer.from(expected, "hex");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
};

/**
 * Resolve the Calendly webhook signing key.
 * dotenv.config() populates process.env from .env, so process.env is the
 * runtime source (also lets tests seed/clear it per request).
 */
export const getSigningKey = (): string | undefined => {
  const key: string | undefined = process.env.CALENDLY_WEBHOOK_SIGNING_KEY;
  return key ? key.trim() : undefined;
};