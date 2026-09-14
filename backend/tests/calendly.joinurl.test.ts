import { getMeetingJoinUrl } from "../src/services/calendly.service";

describe("lib/calendly - getMeetingJoinUrl (Google Meet link extraction)", () => {
  const mockFetch = jest.fn();
  jest.spyOn(global, "fetch").mockImplementation(mockFetch as unknown as typeof fetch);

  afterAll(() => {
    jest.restoreAllMocks();
    delete process.env.CALENDLY_PERSONAL_TOKEN;
    delete process.env.CALENDLY_API_TOKEN;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.CALENDLY_PERSONAL_TOKEN;
    delete process.env.CALENDLY_API_TOKEN;
    mockFetch.mockReset();
  });

  const meetingEventUri = "https://api.calendly.com/scheduled_events/MEET1";
  const meetUrl = "https://meet.google.com/abc-defg-hij";

  const okResource = (resource: Record<string, unknown>) =>
    mockFetch.mockResolvedValue({ ok: true, status: 200, json: async () => ({ resource }) });

  it("extracts resource.location.join_url when location.type is google_conference", async () => {
    process.env.CALENDLY_PERSONAL_TOKEN = "cal_personal_meet";
    okResource({
      uri: meetingEventUri,
      name: "Discovery Call",
      start_time: "2026-09-20T14:30:00.000Z",
      location: { type: "google_conference", join_url: meetUrl },
    });
    await expect(getMeetingJoinUrl(meetingEventUri)).resolves.toBe(meetUrl);
  });

  it("authenticates with CALENDLY_PERSONAL_TOKEN as Bearer on the scheduled_events GET", async () => {
    process.env.CALENDLY_PERSONAL_TOKEN = "cal_personal_meet";
    okResource({ uri: meetingEventUri, location: { type: "google_conference", join_url: meetUrl } });
    await getMeetingJoinUrl(meetingEventUri);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as [string, { headers: Record<string, string> }];
    expect(url).toContain("/scheduled_events/MEET1");
    expect(init.headers.Authorization).toBe("Bearer cal_personal_meet");
  });

  it("falls back to CALENDLY_API_TOKEN when CALENDLY_PERSONAL_TOKEN is not set", async () => {
    process.env.CALENDLY_API_TOKEN = "cal_legacy_token";
    okResource({ uri: meetingEventUri, location: { type: "google_conference", join_url: meetUrl } });
    await getMeetingJoinUrl(meetingEventUri);
    const [url, init] = mockFetch.mock.calls[0] as [string, { headers: Record<string, string> }];
    expect(init.headers.Authorization).toBe("Bearer cal_legacy_token");
  });

  it("returns null when location.type is NOT google_conference", async () => {
    process.env.CALENDLY_API_TOKEN = "cal_legacy_token";
    okResource({ uri: meetingEventUri, location: { type: "physical", location: "HQ Office" } });
    await expect(getMeetingJoinUrl(meetingEventUri)).resolves.toBeNull();
  });

  it("returns null when location is missing or malformed", async () => {
    process.env.CALENDLY_API_TOKEN = "cal_legacy_token";
    okResource({ uri: meetingEventUri });
    await expect(getMeetingJoinUrl(meetingEventUri)).resolves.toBeNull();
  });

  it("returns null (no crash) when the API call fails", async () => {
    process.env.CALENDLY_API_TOKEN = "cal_legacy_token";
    mockFetch.mockResolvedValue({ ok: false, status: 500, json: async () => ({}) });
    await expect(getMeetingJoinUrl(meetingEventUri)).resolves.toBeNull();
    mockFetch.mockRejectedValueOnce(new Error("network down"));
    await expect(getMeetingJoinUrl(meetingEventUri)).resolves.toBeNull();
  });

  it("returns null when no Calendly token is configured (degraded, never throws)", async () => {
    await expect(getMeetingJoinUrl(meetingEventUri)).resolves.toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("accepts a bare UUID in addition to a full URI", async () => {
    process.env.CALENDLY_API_TOKEN = "cal_legacy_token";
    okResource({ uri: meetingEventUri, location: { type: "google_conference", join_url: meetUrl } });
    await expect(getMeetingJoinUrl("MEET1")).resolves.toBe(meetUrl);
  });
});