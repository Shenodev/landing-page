import { hasValidFileSignature, maskEmail, sanitizeSubject, timingSafeCompare } from "../src/lib/security";

describe("Security lib", () => {
  describe("timingSafeCompare", () => {
    it("accepts equal secrets", () => {
      expect(timingSafeCompare("ShenoDev-Projects", "ShenoDev-Projects")).toBe(true);
    });

    it("rejects wrong secrets and length mismatches", () => {
      expect(timingSafeCompare("ShenoDev-Projects", "wrong-secret")).toBe(false);
      expect(timingSafeCompare("short", "much-longer-secret")).toBe(false);
      expect(timingSafeCompare("", "")).toBe(true);
    });
  });

  describe("maskEmail", () => {
    it("masks the local part but keeps the domain", () => {
      expect(maskEmail("george@example.com")).toBe("ge***@example.com");
    });

    it("redacts missing/invalid input", () => {
      expect(maskEmail(undefined)).toBe("[redacted]");
      expect(maskEmail("not-an-email")).toBe("[redacted]");
    });
  });

  describe("sanitizeSubject", () => {
    it("strips CRLF header injection and truncates", () => {
      expect(sanitizeSubject("Hello\r\nBcc: evil@x.com")).toBe("Hello Bcc: evil@x.com");
      expect(sanitizeSubject("a".repeat(200), 120)).toHaveLength(120);
    });
  });

  describe("hasValidFileSignature", () => {
    const png = Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      Buffer.alloc(16, 0),
    ]);
    const jpeg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(16, 0)]);

    it("accepts genuine PNG/JPEG buffers", () => {
      const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
      expect(hasValidFileSignature(png, "image/png", allowed)).toBe(true);
      expect(hasValidFileSignature(jpeg, "image/jpeg", allowed)).toBe(true);
    });

    it("rejects spoofed mimetype (PNG bytes claimed as JPEG)", () => {
      const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
      expect(hasValidFileSignature(png, "image/jpeg", allowed)).toBe(false);
    });

    it("rejects tiny/empty buffers and SVG", () => {
      const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
      expect(hasValidFileSignature(Buffer.alloc(4), "image/png", allowed)).toBe(false);
      expect(hasValidFileSignature(png, "image/svg+xml", allowed)).toBe(false);
    });
  });
});
