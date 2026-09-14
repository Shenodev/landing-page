import { sendResendEmail } from "../src/services/email.service";

const mockSend = jest.fn();
jest.mock("resend", () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: mockSend },
  })),
}));

describe("sendResendEmail - Domain Fallback", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.RESEND_API_KEY = "re_test_fallback_123";
    process.env.RESEND_FROM_EMAIL = "hello@contact.shenodev.tech";
    process.env.ADMIN_EMAIL = "admin@contact.shenodev.tech";
    process.env.RESEND_FALLBACK_DOMAIN = "shenodev.tech";
  });

  it("should try primary domain first and succeed", async () => {
    mockSend.mockResolvedValueOnce({ id: "primary-id" });
    const result = await sendResendEmail({
      replyTo: "user@example.com",
      subject: "Test",
      htmlContent: "<p>Hello</p>",
      isAdminNotification: true,
    });
    expect(mockSend).toHaveBeenCalledTimes(1);
    const firstCall = mockSend.mock.calls[0][0] as Record<string, unknown>;
    expect(firstCall.from).toMatch(/hello@contact\.shenodev\.tech/);
    expect(firstCall.to).toMatch(/admin@contact\.shenodev\.tech/);
    expect(result.id).toBe("primary-id");
  });

  it("should fallback to shenodev.tech when primary fails", async () => {
    mockSend.mockRejectedValueOnce(new Error("Domain not verified: contact.shenodev.tech")).mockResolvedValueOnce({ id: "fallback-id" });
    const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    const result = await sendResendEmail({
      replyTo: "user@example.com",
      subject: "Test Fallback",
      htmlContent: "<p>Hello</p>",
      isAdminNotification: true,
    });

    expect(mockSend).toHaveBeenCalledTimes(2);
    const firstCall = mockSend.mock.calls[0][0] as Record<string, unknown>;
    const secondCall = mockSend.mock.calls[1][0] as Record<string, unknown>;
    expect(firstCall.from).toMatch(/hello@contact\.shenodev\.tech/);
    expect(firstCall.to).toMatch(/admin@contact\.shenodev\.tech/);
    expect(secondCall.from).toMatch(/hello@shenodev\.tech/);
    expect(secondCall.to).toMatch(/admin@shenodev\.tech/);
    expect(result.id).toBe("fallback-id");

    consoleWarnSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  it("should send to user email when isAdminNotification is false", async () => {
    mockSend.mockResolvedValueOnce({ id: "user-id" });
    const result = await sendResendEmail({
      to: "client@example.com",
      subject: "Welcome",
      htmlContent: "<p>Welcome</p>",
      isAdminNotification: false,
    });
    expect(mockSend).toHaveBeenCalledTimes(1);
    const call = mockSend.mock.calls[0][0] as Record<string, unknown>;
    expect(call.to).toBe("client@example.com");
    expect(call.from).toMatch(/hello@contact\.shenodev\.tech/);
  });

  it("should fallback for user email as well", async () => {
    mockSend.mockRejectedValueOnce(new Error("Primary failed")).mockResolvedValueOnce({ id: "fallback-user" });
    const result = await sendResendEmail({
      to: "client@example.com",
      subject: "Welcome",
      htmlContent: "<p>Welcome</p>",
      isAdminNotification: false,
    });
    expect(mockSend).toHaveBeenCalledTimes(2);
    const secondCall = mockSend.mock.calls[1][0] as Record<string, unknown>;
    expect(secondCall.from).toMatch(/hello@shenodev\.tech/);
    expect(secondCall.to).toBe("client@example.com");
  });
});
