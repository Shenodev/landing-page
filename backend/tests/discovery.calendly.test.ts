import request from "supertest";
import { createApp } from "../src/app";

const mockSend = jest.fn().mockResolvedValue({ id: "mock-calendly-id" });
jest.mock("resend", () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: mockSend },
  })),
}));

const mockFetch = jest.fn();
jest.spyOn(global, "fetch").mockImplementation(mockFetch as unknown as typeof fetch);

afterAll(() => {
  jest.restoreAllMocks();
});

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
    process.env.NODE_ENV = "test";
    delete process.env.CALENDLY_API_TOKEN;
    mockFetch.mockReset().mockResolvedValue({ ok: false, status: 404, json: async () => ({}) });
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
      return arg.to === "admin@contact.shenodev.tech" || (Array.isArray(arg.to) && (arg.to as string[]).includes("admin@contact.shenodev.tech"));
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

  it("should handle discovery without server Calendly token (client payload only)", async () => {
    // After cleanup, server does not require CALENDLY_API_TOKEN - relies on client onEventScheduled
    delete process.env.CALENDLY_API_TOKEN;
    delete process.env.CALENDLY_WEBHOOK_SECRET;
    const res = await request(app).post("/api/discovery").send(validDiscoveryWithMeeting);
    expect(res.status).toBe(201);
    expect(res.body.data.meetingDate).toBe("2026-09-20");
  });

  it("should enrich unreliable client meeting time from Calendly API when token is set", async () => {
    process.env.CALENDLY_API_TOKEN = "cal_test_enrichment_token";
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        resource: {
          uri: "https://api.calendly.com/scheduled_events/EVT2026",
          name: "Discovery Call",
          status: "active",
          start_time: "2026-09-20T14:30:00.000Z",
          end_time: "2026-09-20T15:00:00.000Z",
          event_type: "https://api.calendly.com/event_types/ET1",
          scheduling_url: "https://calendly.com/shenodev/discovery",
        },
      }),
    });
    const res = await request(app).post("/api/discovery").send({
      ...validDiscoveryWithMeeting,
      meetingDate: "2026-09-21",
      meetingTime: "09:00",
      calendlyEventUri: "https://api.calendly.com/scheduled_events/EVT2026",
    });
    expect(res.status).toBe(201);
    // Client-captured values are overwritten with the authoritative Calendly start time
    expect(res.body.data.meetingDate).toBe("2026-09-20");
    expect(res.body.data.meetingTime).toBe("14:30");
  });

  it("should keep client meeting fields when Calendly API token is missing (degraded)", async () => {
    const res = await request(app).post("/api/discovery").send({
      ...validDiscoveryWithMeeting,
      calendlyEventUri: "https://api.calendly.com/scheduled_events/EVT2026",
    });
    expect(res.status).toBe(201);
    expect(res.body.data.meetingDate).toBe("2026-09-20");
    expect(res.body.data.meetingTime).toBe("14:30");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("should inject the Google Meet join_url into the confirmation emails instead of the raw API URI", async () => {
    process.env.CALENDLY_API_TOKEN = "cal_meet_injection_token";
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        resource: {
          uri: "https://api.calendly.com/scheduled_events/EVT2026",
          name: "Discovery Call",
          status: "active",
          start_time: "2026-09-20T14:30:00.000Z",
          end_time: "2026-09-20T15:00:00.000Z",
          event_type: "https://api.calendly.com/event_types/ET1",
          scheduling_url: "https://calendly.com/shenodev/discovery",
          location: { type: "google_conference", join_url: "https://meet.google.com/abc-defg-hij" },
        },
      }),
    });
    const res = await request(app).post("/api/discovery").send({
      ...validDiscoveryWithMeeting,
      calendlyEventUri: "https://api.calendly.com/scheduled_events/EVT2026",
    });
    expect(res.status).toBe(201);
    // The raw API URI must never surface as the meeting link; the Meet URL wins.
    expect(res.body.data.meetingUrl).toBe("https://meet.google.com/abc-defg-hij");
    expect(res.body.data.meetingUrl).not.toMatch(/api\.calendly\.com/);

    const calls = mockSend.mock.calls.map((c: unknown[]) => (c[0] as Record<string, unknown>));
    const adminHtml = String(calls.find((c) => String(c.to).includes("admin"))?.html ?? "");
    const welcomeHtml = String(calls.find((c) => c.to === "alex@vancedynamics.io")?.html ?? "");
    expect(adminHtml).toMatch(/meet\.google\.com\/abc-defg-hij/);
    expect(welcomeHtml).toMatch(/meet\.google\.com\/abc-defg-hij/);
    // The confirmation (welcome) email must never expose the raw API resource URI
    expect(welcomeHtml).not.toMatch(/scheduled_events\/EVT2026/);
  });

  it("should fall back to a default meeting-link message when the API has no join_url", async () => {
    process.env.CALENDLY_API_TOKEN = "cal_meet_fallback_token";
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        resource: {
          uri: "https://api.calendly.com/scheduled_events/EVT2026",
          name: "Discovery Call",
          status: "active",
          start_time: "2026-09-20T14:30:00.000Z",
          end_time: "2026-09-20T15:00:00.000Z",
          event_type: "https://api.calendly.com/event_types/ET1",
          location: null,
        },
      }),
    });
    const res = await request(app).post("/api/discovery").send({
      ...validDiscoveryWithMeeting,
      calendlyEventUri: "https://api.calendly.com/scheduled_events/EVT2026",
      meetingUrl: "",
    });
    expect(res.status).toBe(201);
    const calls = mockSend.mock.calls.map((c: unknown[]) => (c[0] as Record<string, unknown>));
    const adminHtml = String(calls.find((c) => String(c.to).includes("admin"))?.html ?? "");
    expect(adminHtml).toMatch(/Meeting link will be provided shortly/);
    const welcomeHtml = String(calls.find((c) => c.to === "alex@vancedynamics.io")?.html ?? "");
    expect(welcomeHtml).toMatch(/Meeting link will be provided shortly/);
    expect(welcomeHtml).not.toMatch(/scheduled_events\/EVT2026/);
  });

  it("should not crash and keep the client link when the Calendly API errored", async () => {
    process.env.CALENDLY_API_TOKEN = "cal_meet_error_token";
    mockFetch.mockResolvedValue({ ok: false, status: 500, json: async () => ({}) });
    const res = await request(app).post("/api/discovery").send(validDiscoveryWithMeeting);
    expect(res.status).toBe(201);
    expect(res.body.data.meetingUrl).toBe("https://calendly.com/shenodev/alex-vance");
    expect(mockSend).toHaveBeenCalledTimes(2);
  });

  it("should neutralize quotes in a client-supplied meeting URL (no attribute breakout)", async () => {
    delete process.env.CALENDLY_API_TOKEN;
    const res = await request(app).post("/api/discovery").send({
      ...validDiscoveryWithMeeting,
      meetingUrl: `https://calendly.com/x?a=" onmouseover="alert(1)`,
    });
    expect(res.status).toBe(201);
    const calls = mockSend.mock.calls.map((c: unknown[]) => (c[0] as Record<string, unknown>));
    const welcomeHtml = String(calls.find((c) => c.to === "alex@vancedynamics.io")?.html ?? "");
    // Quotes are HTML-escaped, so no on* attribute can break out of the href
    expect(welcomeHtml).not.toMatch(/" onmouseover=/);
    expect(welcomeHtml).toMatch(/&quot;/);
  });
});
