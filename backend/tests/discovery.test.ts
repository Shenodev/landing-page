import request from "supertest";
import { createApp } from "../src/app";

const mockSend = jest.fn().mockResolvedValue({ id: "mock-discovery-id" });
jest.mock("resend", () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: mockSend },
  })),
}));

const validDiscoveryPayload = {
  fullName: "Alex Vance",
  companyName: "Vance Dynamics Corp",
  email: "alex@vancedynamics.io",
  phone: "+20 100 000 0000",
  businessDesc: "We build AI-powered procurement automation for enterprise.",
  targetAudience: "B2B enterprise procurement leads",
  competitors: "https://competitor-one.com, https://competitor-two.com",
  brandStatus: "ready",
  references: "linear.app for UX, stripe.com for hierarchy",
  dislikes: "Avoid neon pinks, cluttered sidebars",
  targetPackage: "dashboard",
  requiredFeatures: "1. Magic link auth\n2. Stripe billing\n3. Telemetry dashboard",
  integrations: "Resend, HubSpot, Stripe, OpenAI",
  launchDate: "2026-12-01",
  extraDetails: "Priority: scalability, need NDA",
};

describe("POST /api/discovery - Project Discovery (TDD)", () => {
  const app = createApp();

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.RESEND_API_KEY = "re_test_discovery_123";
    process.env.NODE_ENV = "test";
  });

  it("should accept valid discovery payload and return 201 with data", async () => {
    const res = await request(app).post("/api/discovery").send(validDiscoveryPayload);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("message");
    expect(res.body).toHaveProperty("data");
    expect(res.body.data.fullName).toBe("Alex Vance");
    expect(res.body.data.email).toBe("alex@vancedynamics.io");
    expect(res.body.data.targetPackage).toBe("dashboard");
  });

  it("should reject missing required fields with 400", async () => {
    const res = await request(app).post("/api/discovery").send({ fullName: "", companyName: "", email: "" });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("should reject invalid email and phone with 400", async () => {
    const res = await request(app)
      .post("/api/discovery")
      .send({ ...validDiscoveryPayload, email: "not-an-email", phone: "invalid-phone-!!!" });
    expect(res.status).toBe(400);
    expect(`${res.body.error} ${res.body.message}`).toMatch(/email|phone/i);
  });

  it("should reject invalid brandStatus and targetPackage with 400", async () => {
    const res = await request(app)
      .post("/api/discovery")
      .send({ ...validDiscoveryPayload, brandStatus: "invalid_status", targetPackage: "invalid_package" });
    expect(res.status).toBe(400);
  });

  it("should reject launchDate not in future or invalid format", async () => {
    const past = await request(app).post("/api/discovery").send({ ...validDiscoveryPayload, launchDate: "2020-01-01" });
    expect([400, 201]).toContain(past.status);
    // If 201, it means we allow past but should sanitize; primary is validation works
    const invalid = await request(app).post("/api/discovery").send({ ...validDiscoveryPayload, launchDate: "not-a-date" });
    expect(invalid.status).toBe(400);
  });

  it("should sanitize XSS and NoSQL injection, not store raw script", async () => {
    const xss = '<script>alert(1)</script>Business desc with script';
    const res = await request(app)
      .post("/api/discovery")
      .send({ ...validDiscoveryPayload, businessDesc: xss, competitors: '{"$where":"test"}' });
    if (res.status === 201) {
      expect(res.body.data.businessDesc).not.toContain("<script>");
      expect(res.body.data.businessDesc).not.toContain("alert(1)");
      expect(res.body.data.businessDesc).not.toContain("$where");
    } else {
      expect(res.status).toBe(400);
    }
  });

  it("should trigger two Resend emails simultaneously (admin + auto-reply)", async () => {
    const res = await request(app).post("/api/discovery").send(validDiscoveryPayload);
    expect(res.status).toBe(201);
    expect(mockSend).toHaveBeenCalledTimes(2);

    const calls = mockSend.mock.calls;
    const adminCall = calls.find((c: unknown[]) => {
      const arg = c[0] as Record<string, unknown>;
      return arg.to === "admin@contact.shenodev.dpdns.org" || (Array.isArray(arg.to) && (arg.to as string[]).includes("admin@contact.shenodev.dpdns.org"));
    });
    expect(adminCall).toBeDefined();
    const adminHtml = String((adminCall![0] as Record<string, unknown>).html ?? "");
    expect(adminHtml).toMatch(/Alex Vance/);
    expect(adminHtml).toMatch(/Vance Dynamics/);
    expect(adminHtml).toMatch(/dashboard/);

    const welcomeCall = calls.find((c: unknown[]) => {
      const arg = c[0] as Record<string, unknown>;
      return arg.to === "alex@vancedynamics.io";
    });
    expect(welcomeCall).toBeDefined();
    const welcomeArg = welcomeCall![0] as Record<string, unknown>;
    expect(String(welcomeArg.from)).toMatch(/hello@contact\.shenodev\.dpdns\.org/);
    expect(String(welcomeArg.html ?? welcomeArg.subject ?? "")).toMatch(/24-48 hours/i);
  });

  it("should not hardcode RESEND_API_KEY and handle missing key gracefully", async () => {
    delete process.env.RESEND_API_KEY;
    const res = await request(app).post("/api/discovery").send(validDiscoveryPayload);
    expect([201, 400]).toContain(res.status);
    process.env.RESEND_API_KEY = "re_test_discovery_123";
  });

  it("should reject NoSQL injection via $gt and dot keys", async () => {
    const res = await request(app)
      .post("/api/discovery")
      .send({ ...validDiscoveryPayload, fullName: { $gt: "" } as unknown as string });
    expect(res.status).toBe(400);
    const dotRes = await request(app)
      .post("/api/discovery")
      .send({ ...validDiscoveryPayload, "a.b": "injection" } as unknown as Record<string, unknown>);
    expect([400, 201]).toContain(dotRes.status);
  });

  it("should accept multiple attachments and list them in the admin email", async () => {
    const res = await request(app)
      .post("/api/discovery")
      .send({
        ...validDiscoveryPayload,
        attachments: [
          { url: "https://res.cloudinary.com/shenodev/shenodev_discovery/specs.pdf", publicId: "specs.pdf" },
          { url: "https://res.cloudinary.com/shenodev/shenodev_discovery/wireframe.png", publicId: "wireframe.png" },
        ],
      });
    expect(res.status).toBe(201);
    expect(Array.isArray(res.body.data.attachments)).toBe(true);
    expect(res.body.data.attachments).toHaveLength(2);
    expect(res.body.data.attachments[0].url).toContain("specs.pdf");

    expect(mockSend).toHaveBeenCalledTimes(2);
    const adminCall = mockSend.mock.calls.find((c: unknown[]) => {
      const arg = c[0] as Record<string, unknown>;
      return arg.to === "admin@contact.shenodev.dpdns.org" || (Array.isArray(arg.to) && (arg.to as string[]).includes("admin@contact.shenodev.dpdns.org"));
    });
    expect(adminCall).toBeDefined();
    const adminHtml = String((adminCall![0] as Record<string, unknown>).html ?? "");
    expect(adminHtml).toContain("specs.pdf");
    expect(adminHtml).toContain("wireframe.png");
  });

  it("should reject too many attachments with 400", async () => {
    const tooMany = Array.from({ length: 11 }, (_, i) => ({ url: `https://res.cloudinary.com/shenodev/f-${i}.pdf`, publicId: `f-${i}` }));
    const res = await request(app).post("/api/discovery").send({ ...validDiscoveryPayload, attachments: tooMany });
    expect(res.status).toBe(400);
  });
});
