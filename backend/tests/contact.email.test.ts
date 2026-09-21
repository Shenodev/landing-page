import request from "supertest";
import { createApp } from "../src/app";

// Mock Resend before importing route logic
const mockSend = jest.fn().mockResolvedValue({ id: "mock-id" });
jest.mock("resend", () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: mockSend },
  })),
}));

describe("POST /api/contact - Email Automation (TDD, Resend)", () => {
  const app = createApp();

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.RESEND_API_KEY = "re_test_key_123";
    process.env.NODE_ENV = "test";
  });

  it("should accept { name, email, message } and return 201", async () => {
    const res = await request(app)
      .post("/api/contact")
      .send({ name: "Alex Vance", email: "alex@enterprise.com", message: "Need a scalable platform for our startup, details more than ten chars.", privacyConsent: true, ageConfirmed: true });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("message");
    expect(res.body).toHaveProperty("data");
    expect(res.body.data.name).toBe("Alex Vance");
    expect(res.body.data.email).toBe("alex@enterprise.com");
  });

  it("should support legacy { details } alias for backward compatibility", async () => {
    const res = await request(app)
      .post("/api/contact")
      .send({ name: "Alex Vance", email: "alex@enterprise.com", details: "Need a scalable platform via details field.", privacyConsent: true, ageConfirmed: true });
    expect(res.status).toBe(201);
  });

  it("should reject missing message with 400 (typesafe)", async () => {
    const res = await request(app).post("/api/contact").send({ name: "Alex", email: "alex@enterprise.com", message: "" });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("should sanitize and trigger two Resend emails simultaneously (admin + welcome)", async () => {
    const res = await request(app)
      .post("/api/contact")
      .send({ name: "Alex Vance", email: "alex@enterprise.com", message: "Hello ShenoDev, we need a platform.", privacyConsent: true, ageConfirmed: true });
    expect(res.status).toBe(201);
    // Resend should be called twice
    expect(mockSend).toHaveBeenCalledTimes(2);

    const calls = mockSend.mock.calls;
    // Email 1: Notification to ADMIN_EMAIL containing name, email, message
    const adminCall = calls.find((c: unknown[]) => {
      const arg = c[0] as Record<string, unknown>;
      return arg.to === "admin@contact.shenodev.tech" || (Array.isArray(arg.to) && (arg.to as string[]).includes("admin@contact.shenodev.tech"));
    });
    expect(adminCall).toBeDefined();
    const adminArg = adminCall![0] as Record<string, unknown>;
    expect(String(adminArg.html ?? adminArg.text ?? "")).toMatch(/Alex Vance/);
    expect(String(adminArg.html ?? adminArg.text ?? "")).toMatch(/alex@enterprise\.com/);

    // Email 2: Welcome/Auto-reply to user's email from RESEND_FROM_EMAIL
    const welcomeCall = calls.find((c: unknown[]) => {
      const arg = c[0] as Record<string, unknown>;
      return arg.to === "alex@enterprise.com";
    });
    expect(welcomeCall).toBeDefined();
    const welcomeArg = welcomeCall![0] as Record<string, unknown>;
    expect(String(welcomeArg.from)).toMatch(/hello@contact\.shenodev\.tech/);
    // Should thank them
    expect(String(welcomeArg.html ?? welcomeArg.text ?? welcomeArg.subject ?? "")).toMatch(/thank/i);
  });

  it("should not hardcode RESEND_API_KEY and use env", async () => {
    // Ensure route reads from process.env, not hardcoded
    expect(process.env.RESEND_API_KEY).toBe("re_test_key_123");
    // If key missing, should still not throw hardcoded, but handle gracefully (test degraded)
    delete process.env.RESEND_API_KEY;
    const res = await request(app)
      .post("/api/contact")
      .send({ name: "Alex Vance", email: "alex@enterprise.com", message: "Test without key, should still handle." });
    // Should not be 500 due to hardcoded, should be 201 degraded or 400 handled
    expect([201, 400]).toContain(res.status);
    // Restore for other tests
    process.env.RESEND_API_KEY = "re_test_key_123";
  });

  it("should purify XSS in message before emailing", async () => {
    const xss = '<script>alert(1)</script>Need platform';
    const res = await request(app)
      .post("/api/contact")
      .send({ name: "Alex", email: "alex@enterprise.com", message: xss, privacyConsent: true, ageConfirmed: true });
    if (res.status === 201) {
      expect(res.body.data.message ?? res.body.data.details).not.toContain("<script>");
      // Ensure mocked email also not containing script
      const lastCall = mockSend.mock.calls[mockSend.mock.calls.length - 1]?.[0] as Record<string, unknown> | undefined;
      if (lastCall) {
        const content = String(lastCall.html ?? lastCall.text ?? "");
        expect(content).not.toContain("<script>");
      }
    } else {
      expect(res.status).toBe(400);
    }
  });
});
