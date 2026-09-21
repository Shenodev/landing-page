import request from "supertest";
import { createApp } from "../src/app";

const mockSend = jest.fn().mockResolvedValue({ id: "mock-privacy-id" });
jest.mock("resend", () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: mockSend },
  })),
}));

describe("Privacy rights endpoints (unsubscribe + deletion requests)", () => {
  const app = createApp();

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.RESEND_API_KEY = "re_test_privacy_123";
    process.env.NODE_ENV = "test";
  });

  describe("POST /api/unsubscribe", () => {
    it("accepts a valid email with 200", async () => {
      const res = await request(app).post("/api/unsubscribe").send({ email: "tired@example.com" });
      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/unsubscribed/i);
    });

    it("is idempotent — repeat unsubscribes still 200", async () => {
      await request(app).post("/api/unsubscribe").send({ email: "repeat@example.com" });
      const res = await request(app).post("/api/unsubscribe").send({ email: "repeat@example.com" });
      expect(res.status).toBe(200);
    });

    it("rejects invalid email with 400", async () => {
      const res = await request(app).post("/api/unsubscribe").send({ email: "not-an-email" });
      expect(res.status).toBe(400);
    });

    it("rejects missing email with 400", async () => {
      const res = await request(app).post("/api/unsubscribe").send({});
      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/privacy/deletion-request", () => {
    it("accepts a valid request with 201", async () => {
      const res = await request(app)
        .post("/api/privacy/deletion-request")
        .send({ name: "Alex Vance", email: "alex@enterprise.com", details: "Please delete everything." });
      expect(res.status).toBe(201);
      expect(res.body.message).toMatch(/30 days/i);
    });

    it("rejects invalid email with 400", async () => {
      const res = await request(app)
        .post("/api/privacy/deletion-request")
        .send({ name: "Alex Vance", email: "nope", details: "" });
      expect(res.status).toBe(400);
    });
  });

  describe("consent enforcement", () => {
    it("rejects contact without privacyConsent with 400", async () => {
      const res = await request(app)
        .post("/api/contact")
        .send({ name: "Alex Vance", email: "alex@enterprise.com", details: "Need a scalable platform for our startup." });
      expect(res.status).toBe(400);
      expect(`${res.body.error} ${res.body.message}`).toMatch(/consent/i);
    });

    it("rejects discovery without ageConfirmed with 400", async () => {
      const res = await request(app).post("/api/discovery").send({
        fullName: "Alex Vance",
        companyName: "Vance Dynamics Corp",
        email: "alex@vancedynamics.io",
        businessDesc: "We build AI-powered procurement automation for enterprise.",
        brandStatus: "ready",
        targetPackage: "dashboard",
        privacyConsent: true,
      });
      expect(res.status).toBe(400);
      expect(`${res.body.error} ${res.body.message}`).toMatch(/age/i);
    });
  });
});
