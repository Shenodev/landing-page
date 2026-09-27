import request from "supertest";
import type { Express } from "express";

// The edge is the only thing standing between a traffic spike and the origin
// function. These tests pin the header contract that decides how often a
// revalidation window opens, and guarantee an outage is never itself cached.
jest.mock("../src/models/Project", () => ({
  Project: {
    find: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    deleteOne: jest.fn(),
  },
}));

jest.mock("../src/config/db", () => ({
  ...jest.requireActual("../src/config/db"),
  getConnectionState: jest.fn(() => 1),
}))

// See projects.availability.test.ts: faking the connection state also tells the
// shared rate limit store a database is available, so its collection calls are
// made to fail fast instead of waiting on a connection that will not come.
jest.mock("../src/models/RateLimit", () => {
  const unavailable = (): Promise<never> => Promise.reject(new Error("rate limit store unavailable in test"));
  return {
    RateLimit: {
      findOneAndUpdate: jest.fn(unavailable),
      replaceIfExpired: jest.fn(unavailable),
      create: jest.fn(unavailable),
      updateOne: jest.fn(unavailable),
      deleteOne: jest.fn(unavailable),
    },
  };
});

import { Project } from "../src/models/Project";
import { createApp } from "../src/app";

const mockedFind = Project.find as unknown as jest.Mock;

const leanThen = (value: unknown): jest.Mock => {
  const chain: Record<string, unknown> = { sort: jest.fn() };
  (chain.sort as jest.Mock).mockReturnValue({ lean: jest.fn().mockResolvedValue(value) });
  return chain as unknown as jest.Mock;
};

const parseCacheControl = (header: string | undefined): string[] =>
  (header ?? "")
    .split(",")
    .map((p) => p.trim().toLowerCase());

describe("Public feed cache contract", () => {
  const app: Express = createApp();

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ADMIN_SECRET = "test-admin-secret-123";
  });

  it("shares the list with a long shared-cache TTL so the origin is hit rarely", async () => {
    mockedFind.mockReturnValue(leanThen([{ _id: "a", title: "P" }]));

    const res = await request(app).get("/api/projects");
    const directives = parseCacheControl(res.headers["cache-control"]);

    // A short s-maxage reopens the revalidation window often, and every request
    // that arrives inside that window is forwarded to the function at once.
    const sMaxAge = directives.find((d) => d.startsWith("s-maxage="));
    expect(sMaxAge).toBeDefined();
    const seconds = Number(sMaxAge?.split("=")[1]);
    expect(seconds).toBeGreaterThanOrEqual(300);
  });

  it("keeps serving stale content while the origin revalidates", async () => {
    mockedFind.mockReturnValue(leanThen([{ _id: "a", title: "P" }]));

    const res = await request(app).get("/api/projects");
    const directives = parseCacheControl(res.headers["cache-control"]);

    expect(directives).toContain("stale-while-revalidate=300");
  });

  it("can serve stale content when the origin errors, instead of surfacing the error", async () => {
    mockedFind.mockReturnValue(leanThen([{ _id: "a", title: "P" }]));

    const res = await request(app).get("/api/projects");
    const directives = parseCacheControl(res.headers["cache-control"]);

    expect(directives).toEqual(expect.arrayContaining([expect.stringMatching(/^stale-if-error=\d+$/)]));
  });

  it("never marks an error response as publicly cacheable", async () => {
    // Regression guard: the header is set after the data is fetched, so a throw
    // skips it. If anyone moves the header above the await, a 503 would be
    // stored at the edge and every visitor would get a cached blank portfolio.
    mockedFind.mockImplementation(() => {
      throw new Error("connection pool exhausted");
    });

    const res = await request(app).get("/api/projects");

    expect(res.status).toBe(503);
    expect(parseCacheControl(res.headers["cache-control"])).not.toContain("public");
  });

  it("keeps the browser cache short so the visitor's own copy stays fresh", async () => {
    mockedFind.mockReturnValue(leanThen([{ _id: "a", title: "P" }]));

    const res = await request(app).get("/api/projects");
    const directives = parseCacheControl(res.headers["cache-control"]);
    const maxAge = directives.find((d) => d.startsWith("max-age="));

    expect(Number(maxAge?.split("=")[1])).toBeLessThanOrEqual(60);
  });
});
