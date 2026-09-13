import crypto from "crypto";
import request from "supertest";
import { createApp } from "../src/app";
import { verifyCalendlySignature, parseCalendlySignature } from "../src/lib/calendlyWebhook";

const mockSend = jest.fn().mockResolvedValue({ id: "mock-email-id" });
jest.mock("resend", () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: mockSend },
  })),
}));

const SIGNING_KEY = "test-webhook-signing-key";

const mockFetch = jest.fn();
jest.spyOn(global, "fetch").mockImplementation(mockFetch as unknown as typeof fetch);

afterAll(() => {
  jest.restoreAllMocks();
});

const signedHeaders = (rawBody: string, nowOffsetSec = 0): { timestamp: string; signature: string; header: string } => {
  const timestamp: string = String(Math.floor(Date.now() / 1000) + nowOffsetSec);
  const signature: string = crypto.createHmac("sha256", SIGNING_KEY).update(`${timestamp}.${rawBody}`).digest("hex");
  return { timestamp, signature, header: `t=${timestamp},v1=${signature}` };
};

const inviteeCreatedBody = JSON.stringify({
  event: "invitee.created",
  created_at: "2024-01-15T10:30:00.000000Z",
  created_by: "https://api.calendly.com/users/ABC",
  payload: {
    uri: "https://api.calendly.com/scheduled_events/EVT1/invitees/INV1",
    email: "jane@example.com",
    name: "Jane Doe",
    status: "active",
    timezone: "America/New_York",
    event: "https://api.calendly.com/scheduled_events/EVT1",
    cancel_url: "https://calendly.com/cancellations/INV1",
    reschedule_url: "https://calendly.com/reschedulings/INV1",
    scheduled_event: {
      uri: "https://api.calendly.com/scheduled_events/EVT1",
      name: "Discovery Call",
      start_time: "2024-01-20T15:00:00.000000Z",
      end_time: "2024-01-20T15:30:00.000000Z",
      status: "active",
      scheduling_url: "https://calendly.com/shenodev/discovery",
    },
  },
});

const inviteeCanceledBody = JSON.stringify({
  event: "invitee.canceled",
  created_at: "2024-01-16T08:00:00.000000Z",
  payload: {
    uri: "https://api.calendly.com/scheduled_events/EVT1/invitees/INV1",
    email: "jane@example.com",
    event: "https://api.calendly.com/scheduled_events/EVT1",
    cancellation: { canceled_by: "Jane Doe", reason: "Schedule conflict" },
  },
});

describe("lib/calendlyWebhook - signature verification", () => {
  it("parses t= and v1= from the header", () => {
    const parsed = parseCalendlySignature("t=1719921600,v1=8f2dabcd");
    expect(parsed).toEqual({ timestamp: "1719921600", signature: "8f2dabcd" });
  });

  it("rejects missing/malformed headers", () => {
    expect(parseCalendlySignature(undefined)).toBeNull();
    expect(parseCalendlySignature("foo=bar")).toBeNull();
  });

  it("verifies a valid signature over the raw body", () => {
    const { header } = signedHeaders(inviteeCreatedBody);
    expect(verifyCalendlySignature(inviteeCreatedBody, header, SIGNING_KEY)).toBe(true);
  });

  it("rejects a tampered body", () => {
    const { header } = signedHeaders(inviteeCreatedBody);
    const tampered = inviteeCreatedBody.replace("jane@example.com", "mallory@example.com");
    expect(verifyCalendlySignature(tampered, header, SIGNING_KEY)).toBe(false);
  });

  it("rejects a wrong signing key", () => {
    const { header } = signedHeaders(inviteeCreatedBody);
    expect(verifyCalendlySignature(inviteeCreatedBody, header, "another-key")).toBe(false);
  });

  it("rejects a stale timestamp (replay protection)", () => {
    const { header } = signedHeaders(inviteeCreatedBody, -400);
    expect(verifyCalendlySignature(inviteeCreatedBody, header, SIGNING_KEY)).toBe(false);
  });

  it("rejects when no header or signing key provided", () => {
    expect(verifyCalendlySignature(inviteeCreatedBody, undefined, SIGNING_KEY)).toBe(false);
    expect(verifyCalendlySignature(inviteeCreatedBody, "t=1,v1=abc", undefined)).toBe(false);
  });
});

describe("POST /api/calendly/webhook", () => {
  const app = createApp();

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = "test";
    process.env.RESEND_API_KEY = "re_test_webhook_123";
    process.env.CALENDLY_WEBHOOK_SIGNING_KEY = SIGNING_KEY;
    delete process.env.CALENDLY_PERSONAL_TOKEN;
    delete process.env.CALENDLY_API_TOKEN;
    mockFetch.mockReset().mockResolvedValue({ ok: false, status: 404, json: async () => ({}) });
  });

  afterEach(() => {
    delete process.env.CALENDLY_WEBHOOK_SIGNING_KEY;
  });

  const postSigned = (rawBody: string, key: string) =>
    request(app).post("/api/calendly/webhook").set("Content-Type", "application/json").set("Calendly-Webhook-Signature", key).send(rawBody);

  it("acknowledges invitee.created with a valid signature (200) and does NOT send any email", async () => {
    const { header } = signedHeaders(inviteeCreatedBody);
    const res = await postSigned(inviteeCreatedBody, header);
    expect(res.status).toBe(200);
    expect(res.body.received).toBe(true);
    // No email from the webhook - confirmation email is sent only after the discovery form arrives
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("GETs the scheduled event with CALENDLY_PERSONAL_TOKEN to resolve the Google Meet link", async () => {
    process.env.CALENDLY_PERSONAL_TOKEN = "cal_personal_webhook_meet";
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        resource: {
          uri: "https://api.calendly.com/scheduled_events/EVT1",
          name: "Discovery Call",
          start_time: "2024-01-20T15:00:00.000000Z",
          end_time: "2024-01-20T15:30:00.000000Z",
          location: { type: "google_conference", join_url: "https://meet.google.com/wxyz-1234-567" },
        },
      }),
    });
    const { header } = signedHeaders(inviteeCreatedBody);
    const res = await postSigned(inviteeCreatedBody, header);
    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as [string, { headers: Record<string, string> }];
    expect(url).toContain("/scheduled_events/EVT1");
    expect(init.headers.Authorization).toBe("Bearer cal_personal_webhook_meet");
  });

  it("acknowledges invitee.canceled with a valid signature (200)", async () => {
    const { header } = signedHeaders(inviteeCanceledBody);
    const res = await postSigned(inviteeCanceledBody, header);
    expect(res.status).toBe(200);
  });

  it("acknowledges unknown events with 200 (no-op)", async () => {
    const raw = JSON.stringify({ event: "routing_form_submission.created", payload: {} });
    const { header } = signedHeaders(raw);
    const res = await postSigned(raw, header);
    expect(res.status).toBe(200);
  });

  it("rejects a request with an invalid signature (401)", async () => {
    const { header } = signedHeaders(inviteeCreatedBody);
    const malformed = inviteeCreatedBody.replace("Discovery Call", "Hacked Event");
    const res = await postSigned(malformed, header);
    expect(res.status).toBe(401);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("rejects requests when no signing key is configured (503)", async () => {
    delete process.env.CALENDLY_WEBHOOK_SIGNING_KEY;
    const { header } = signedHeaders(inviteeCreatedBody);
    const res = await postSigned(inviteeCreatedBody, header);
    expect(res.status).toBe(503);
  });

  it("rejects a replay (stale timestamp) with 401", async () => {
    const { header } = signedHeaders(inviteeCreatedBody, -400);
    const res = await postSigned(inviteeCreatedBody, header);
    expect(res.status).toBe(401);
  });

  it("rejects a request missing the signature header (401)", async () => {
    const res = await request(app).post("/api/calendly/webhook").set("Content-Type", "application/json").send(inviteeCreatedBody);
    expect(res.status).toBe(401);
  });
});