import request from "supertest";
import { createApp } from "../src/app";

const mockSend = jest.fn().mockResolvedValue({ id: "mock-discovery-upload-id" });
jest.mock("resend", () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: mockSend },
  })),
}));

jest.mock("../src/config/cloudinary", () => ({
  uploadToCloudinary: jest.fn().mockImplementation(async (_fileBuffer: Buffer) => ({
    secure_url: "https://res.cloudinary.com/shenodev/shenodev_discovery/mock-upload.pdf",
    public_id: "mock-upload-public-id",
  })),
}));

const validFields = {
  fullName: "Alex Vance",
  companyName: "Vance Dynamics Corp",
  email: "alex@vancedynamics.io",
  phone: "+20 100 000 0000",
  businessDesc: "We build AI-powered procurement automation for enterprise.",
  targetAudience: "B2B enterprise procurement leads",
  competitors: "https://competitor-one.com",
  brandStatus: "ready",
  targetPackage: "dashboard",
  launchDate: "2026-12-01",
};

describe("POST /api/discovery - multipart file attachments (TDD)", () => {
  const app = createApp();

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.RESEND_API_KEY = "re_test_discovery_upload_123";
    process.env.NODE_ENV = "test";
  });

  it("should accept multiple file uploads via the 'attachments' field and persist them", async () => {
    const res = await request(app)
      .post("/api/discovery")
      .field("fullName", validFields.fullName)
      .field("companyName", validFields.companyName)
      .field("email", validFields.email)
      .field("phone", validFields.phone)
      .field("businessDesc", validFields.businessDesc)
      .field("targetAudience", validFields.targetAudience)
      .field("competitors", validFields.competitors)
      .field("brandStatus", validFields.brandStatus)
      .field("targetPackage", validFields.targetPackage)
      .field("launchDate", validFields.launchDate)
      .attach("attachments", Buffer.from("%PDF-1.4 test"), { filename: "specs.pdf", contentType: "application/pdf" })
      .attach("attachments", Buffer.from("png-data"), { filename: "wire.png", contentType: "image/png" });

    expect(res.status).toBe(201);
    expect(res.body.data.attachments).toHaveLength(2);
    expect(res.body.data.attachments[0].fileName).toBe("specs.pdf");
    expect(res.body.data.attachments[0].mimeType).toBe("application/pdf");
    expect(res.body.data.attachments[1].fileName).toBe("wire.png");
    expect(res.body.data.attachmentUrl).toContain("cloudinary");
  });

  it("should also accept the legacy single 'attachment' field", async () => {
    const res = await request(app)
      .post("/api/discovery")
      .field("fullName", validFields.fullName)
      .field("companyName", validFields.companyName)
      .field("email", validFields.email)
      .field("phone", validFields.phone)
      .field("businessDesc", validFields.businessDesc)
      .field("targetAudience", validFields.targetAudience)
      .field("competitors", validFields.competitors)
      .field("brandStatus", validFields.brandStatus)
      .field("targetPackage", validFields.targetPackage)
      .field("launchDate", validFields.launchDate)
      .attach("attachment", Buffer.from("logo-bytes"), { filename: "logo.png", contentType: "image/png" });

    expect(res.status).toBe(201);
    expect(res.body.data.attachments).toHaveLength(1);
    expect(res.body.data.attachments[0].fileName).toBe("logo.png");
  });

  it("should reject files with an unsupported content type", async () => {
    const res = await request(app)
      .post("/api/discovery")
      .field("fullName", validFields.fullName)
      .field("companyName", validFields.companyName)
      .field("email", validFields.email)
      .field("phone", validFields.phone)
      .field("businessDesc", validFields.businessDesc)
      .field("targetAudience", validFields.targetAudience)
      .field("competitors", validFields.competitors)
      .field("brandStatus", validFields.brandStatus)
      .field("targetPackage", validFields.targetPackage)
      .field("launchDate", validFields.launchDate)
      .attach("attachments", Buffer.from("exe-bytes"), { filename: "malware.exe", contentType: "application/x-msdownload" });

    expect([400, 500]).toContain(res.status);
    expect(res.body.message).toMatch(/Unsupported file type/i);
  });
});