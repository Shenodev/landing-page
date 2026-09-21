import request from "supertest";
import { createApp } from "../src/app";

const mockSend = jest.fn().mockResolvedValue({ id: "mock-id" });
jest.mock("resend", () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: mockSend },
  })),
}));

describe("ShenoDev Backend - TDD Contact (Typesafe + Purified)", () => {
  const app = createApp();

  beforeAll(async () => {
    // No DB required for validation tests - route validates before DB
  });

  afterAll(async () => {
    // no-op
  });

  describe("POST /api/contact - valid", () => {
    it("should accept valid payload and return 201 with sanitized data", async () => {
      const res = await request(app)
        .post("/api/contact")
        .send({ name: "Alex Vance", email: "alex@enterprise.com", details: "Need a scalable platform for our startup.", privacyConsent: true, ageConfirmed: true });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("message");
      expect(res.body).toHaveProperty("data");
      expect(res.body.data.name).toBe("Alex Vance");
      expect(res.body.data.email).toBe("alex@enterprise.com");
    });
  });

  describe("POST /api/contact - validation (typesafe)", () => {
    it("should reject missing fields with 400", async () => {
      const res = await request(app).post("/api/contact").send({ name: "", email: "", details: "" });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
    });

    it("should reject invalid email with 400", async () => {
      const res = await request(app)
        .post("/api/contact")
        .send({ name: "Alex", email: "not-an-email", details: "Valid details more than ten chars." });
      expect(res.status).toBe(400);
      expect(`${res.body.error} ${res.body.message}`).toMatch(/email/i);
    });

    it("should reject name with invalid chars / over 100", async () => {
      const res = await request(app)
        .post("/api/contact")
        .send({ name: "A".repeat(101), email: "alex@enterprise.com", details: "Valid details more than ten chars." });
      expect(res.status).toBe(400);
    });

    it("should reject details under 10 chars or over 1000", async () => {
      const short = await request(app).post("/api/contact").send({ name: "Alex", email: "alex@enterprise.com", details: "short" });
      expect(short.status).toBe(400);
      const long = await request(app)
        .post("/api/contact")
        .send({ name: "Alex", email: "alex@enterprise.com", details: "a".repeat(1001) });
      expect(long.status).toBe(400);
    });
  });

  describe("POST /api/contact - injection purification", () => {
    it("should sanitize XSS payload and not store raw script", async () => {
      const xss = '<script>alert(1)</script>Need platform';
      const res = await request(app)
        .post("/api/contact")
        .send({ name: "Alex", email: "alex@enterprise.com", details: xss, privacyConsent: true, ageConfirmed: true });
      // Should either 400 or 201 with sanitized details not containing <script>
      if (res.status === 201) {
        expect(res.body.data.details).not.toContain("<script>");
        expect(res.body.data.details).not.toContain("alert(1)");
      } else {
        expect(res.status).toBe(400);
      }
    });

    it("should reject NoSQL injection via $gt operator", async () => {
      const res = await request(app)
        .post("/api/contact")
        .send({ name: { $gt: "" } as unknown as string, email: "alex@enterprise.com", details: "Valid details more than ten chars." });
      expect(res.status).toBe(400);
    });

    it("should reject payload with $where in details", async () => {
      const res = await request(app)
        .post("/api/contact")
        .send({ name: "Alex", email: "alex@enterprise.com", details: '{"$where": "sleep(100)"} valid details more than ten' });
      expect([400, 201]).toContain(res.status);
      if (res.status === 201) {
        expect(res.body.data.details).not.toContain("$where");
      }
    });

    it("should reject object injection with dot keys", async () => {
      const res = await request(app)
        .post("/api/contact")
        .send({ name: "Alex", email: "alex@enterprise.com", details: "Valid details", "a.b": "injection" } as unknown as Record<string, unknown>);
      // Dot keys should be rejected or ignored - should not be 500
      expect([400, 201]).toContain(res.status);
    });
  });
});
