import { pickSchedulingUrl, isApiCalendlyUrl } from "../src/lib/calendly";

describe("calendly meeting-link helpers (TDD)", () => {
  it("should prefer invitee.scheduling_url (specific booking link) over all others", () => {
    const payload: Record<string, unknown> = {
      invitee: {
        uri: "https://api.calendly.com/scheduled_events/30e14008-484c-4dbf-82c4-9a0478bcf38e/invitees/INV1",
        scheduling_url: "https://calendly.com/shenodev/discovery/30e14008-484c-4dbf-82c4-9a0478bcf38e",
      },
      event: {
        uri: "https://api.calendly.com/scheduled_events/30e14008-484c-4dbf-82c4-9a0478bcf38e",
        scheduling_url: "https://calendly.com/shenodev/discovery",
      },
      scheduled_event: { scheduling_url: "https://calendly.com/shenodev/discovery-legacy" },
      scheduling_url: "https://calendly.com/shenodev/discovery-top",
    };
    expect(pickSchedulingUrl(payload)).toBe("https://calendly.com/shenodev/discovery/30e14008-484c-4dbf-82c4-9a0478bcf38e");
  });

  it("should fall back to embed event.scheduling_url when invitee link is missing", () => {
    const payload: Record<string, unknown> = {
      invitee: { uri: "https://api.calendly.com/scheduled_events/E1/invitees/I1" },
      event: { uri: "https://api.calendly.com/scheduled_events/E1", scheduling_url: "https://calendly.com/shenodev/discovery" },
    };
    expect(pickSchedulingUrl(payload)).toBe("https://calendly.com/shenodev/discovery");
  });

  it("should fall back to legacy scheduled_event.scheduling_url then top-level payload.scheduling_url", () => {
    const legacy: Record<string, unknown> = {
      event: "https://api.calendly.com/scheduled_events/E1",
      scheduled_event: { scheduling_url: "https://calendly.com/shenodev/discovery-legacy" },
    };
    expect(pickSchedulingUrl(legacy)).toBe("https://calendly.com/shenodev/discovery-legacy");

    const topLevel: Record<string, unknown> = {
      uri: "https://api.calendly.com/scheduled_events/E1/invitees/I1",
      scheduling_url: "https://calendly.com/shenodev/discovery-top",
    };
    expect(pickSchedulingUrl(topLevel)).toBe("https://calendly.com/shenodev/discovery-top");
  });

  it("should return an empty string when no scheduling link exists (never leak an API uri)", () => {
    const payload: Record<string, unknown> = {
      invitee: { uri: "https://api.calendly.com/scheduled_events/E1/invitees/I1" },
      event: { uri: "https://api.calendly.com/scheduled_events/E1" },
    };
    expect(pickSchedulingUrl(payload)).toBe("");
  });

  it("should detect Calendly REST API resources vs human-clickable pages", () => {
    expect(isApiCalendlyUrl("https://api.calendly.com/scheduled_events/ABC123")).toBe(true);
    expect(isApiCalendlyUrl("https://api.calendly.com/scheduled_events/ABC/invitees/I1")).toBe(true);
    expect(isApiCalendlyUrl("https://calendly.com/shenodev/discovery")).toBe(false);
    expect(isApiCalendlyUrl("https://calendly.com/shenodev/discovery/ABC123")).toBe(false);
  });
});