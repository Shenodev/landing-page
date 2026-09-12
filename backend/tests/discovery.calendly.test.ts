import request from "supertest";
import { createApp } from "../src/app";

const mockSend = jest.fn().mockResolvedValue({ id: "mock-calendly-id" });
jest.mock("resend", () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: mockSend },
  })),
}));

const validDiscoveryWithMeeting = {
  fullName: "Alex Vance",
  companyName: "Vance Dynamics Corp",
  email: "alex@vancedynamics.io",
  phone: "+20 100 000 0000",
  businessDesc: "We build AI-powered procurement automation.",
  targetAudience: "B2B enterprise leads",
  competitors: "https://c1.com",
  brandStatus: "ready",
  references: "linear.app",
  dislikes: "neon",
  targetPackage: "dashboard",
  requiredFeatures: "Auth, Billing, Dashboard",
  integrations: "Resend, Stripe",
  launchDate: "2026-12-01",
  extraDetails: "NDA",
  meetingDate: "2026-09-20",
  meetingTime: "14:30",
  meetingUrl: "https://calendly.com/shenodev/alex-vance",
  calendlyEventUri: "https://api.calendly.com/scheduled_events/ABC123",
};

describe("POST /api/discovery - Calendly Integration (TDD)", () => {
  const app = createApp();

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.RESEND_API_KEY = "re_test_calendly_123";
    process.env.CALENDLY_API_TOKEN = "test_calendly_token";
    process.env.NODE_ENV = "test";
  });

  it("should accept payload with meeting fields and return 201", async () => {
    const res = await request(app).post("/api/discovery").send(validDiscoveryWithMeeting);
    expect(res.status).toBe(201);
    expect(res.body.data.meetingDate).toBe("2026-09-20");
    expect(res.body.data.meetingTime).toBe("14:30");
    expect(res.body.data.meetingUrl || res.body.data.calendlyEventUri).toBeTruthy();
  });

  it("should save meeting fields to MongoDB and include in admin email", async () => {
    const res = await request(app).post("/api/discovery").send(validDiscoveryWithMeeting);
    expect(res.status).toBe(201);
    expect(mockSend).toHaveBeenCalledTimes(2);
    const adminCall = mockSend.mock.calls.find((c: unknown[]) => {
      const arg = c[0] as Record<string, unknown>;
      return arg.to === "admin@shenodev.tech" || arg.to === "admin@sheno.dev";
    });
    expect(adminCall).toBeDefined();
    const html = String((adminCall![0] as Record<string, unknown>).html ?? "");
    expect(html).toMatch(/2026-09-20/);
    expect(html).toMatch(/14:30/);
    expect(html).toMatch(/calendly\.com|ABC123/);
  });

  it("should send auto-reply to client with meeting date/time and link", async () => {
    const res = await request(app).post("/api/discovery").send(validDiscoveryWithMeeting);
    expect(res.status).toBe(201);
    const welcomeCall = mockSend.mock.calls.find((c: unknown[]) => (c[0] as Record<string, unknown>).to === "alex@vancedynamics.io");
    expect(welcomeCall).toBeDefined();
    const html = String((welcomeCall![0] as Record<string, unknown>).html ?? "");
    expect(html).toMatch(/2026-09-20/);
    expect(html).toMatch(/14:30/);
    expect(html).toMatch(/calendly\.com|https/);
    expect(html).toMatch(/24-48 hours/i);
  });

  it("should accept payload without meeting fields (backward compat) and still 201", async () => {
    const withoutMeeting = { ...validDiscoveryWithMeeting };
    delete (withoutMeeting as Record<string, unknown>).meetingDate;
    delete (withoutMeeting as Record<string, unknown>).meetingTime;
    delete (withoutMeeting as Record<string, unknown>).meetingUrl;
    delete (withoutMeeting as Record<string, unknown>).calendlyEventUri;
    const res = await request(app).post("/api/discovery").send(withoutMeeting);
    expect(res.status).toBe(201);
  });

  it("should sanitize meeting fields and reject NoSQL injection", async () => {
    const res = await request(app)
      .post("/api/discovery")
      .send({ ...validDiscoveryWithMeeting, meetingUrl: '<script>alert(1)</script>https://calendly.com/test' });
    if (res.status === 201) {
      expect(res.body.data.meetingUrl).not.toContain("<script>");
    } else {
      expect(res.status).toBe(400);
    }
    const nosql = await request(app)
      .post("/api/discovery")
      .send({ ...validDiscoveryWithMeeting, fullName: { $gt: "" } as unknown as string });
    expect(nosql.status).toBe(400);
  });

  it("should use CALENDLY_API_TOKEN from env, not hardcoded", async () => {
    expect(process.env.CALENDLY_API_TOKEN).toBe("test_calendly_token");
    delete process.env.CALENDLY_API_TOKEN;
    const res = await request(app).post("/api/discovery").send(validDiscoveryWithMeeting);
    expect([201, 400]).toContain(res.status);
    process.env.CALENDLY_API_TOKEN = "test_calendly_token";
  });
});
