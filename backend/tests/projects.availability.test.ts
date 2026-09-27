import request from "supertest";
import type { Express } from "express";

// The data layer is the unit under test here: we simulate a database that is
// unreachable so we can prove the API reports the outage instead of inventing
// an empty portfolio.
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
}));

// getConnectionState is faked to 1 above so the data layer looks healthy, which
// also tells the shared rate limit store the database is up. There is no real
// connection here, so the store's collection calls are made to fail fast rather
// than queue behind a 30s connection attempt. This file is about the data layer.
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
import { getConnectionState } from "../src/config/db";
import { createApp } from "../src/app";

const mockedFind = Project.find as unknown as jest.Mock;
const mockedState = getConnectionState as unknown as jest.Mock;

const validProject = {
  title: "Availability Project",
  description: "A project used to verify data-layer availability behaviour end to end.",
  imageUrl: "https://cdn.shenodev.tech/projects/availability.jpg",
  techStack: ["Next.js", "Node.js"],
  demoUrl: "https://demo.shenodev.tech/availability",
  githubUrl: "",
};

const leanThen = (value: unknown): jest.Mock => {
  const chain: Record<string, unknown> = { sort: jest.fn() };
  (chain.sort as jest.Mock).mockReturnValue({ lean: jest.fn().mockResolvedValue(value) });
  return chain as unknown as jest.Mock;
};

describe("Projects API - data-layer availability", () => {
  const app: Express = createApp();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedState.mockReturnValue(1);
    process.env.ADMIN_SECRET = "test-admin-secret-123";
  });

  it("returns 503, not an empty list, when the database query fails", async () => {
    mockedFind.mockImplementation(() => {
      throw new Error("connection pool exhausted");
    });

    const res = await request(app).get("/api/projects");

    expect(res.status).toBe(503);
    expect(Array.isArray(res.body.data)).toBe(false);
  });

  it("never serves an empty 200 to a visitor when the database is down", async () => {
    mockedFind.mockImplementation(() => {
      throw new Error("not connected");
    });

    const res = await request(app).get("/api/projects");

    // The dangerous shape is 200 + { data: [] }: a blank portfolio that looks
    // like a successful response with no content. Neither half may appear.
    expect(res.status).not.toBe(200);
    expect(res.body).not.toHaveProperty("data");
    expect(res.body.statusCode).toBe(503);
  });

  it("still serves the real list when the database is healthy", async () => {
    mockedFind.mockReturnValue(leanThen([{ _id: "a", title: "Real project" }]));

    const res = await request(app).get("/api/projects");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it("reports 503 on the guarded admin read too, rather than an empty list", async () => {
    mockedFind.mockImplementation(() => {
      throw new Error("connection pool exhausted");
    });

    const res = await request(app)
      .get("/api/projects/admin")
      .set("x-admin-secret", "test-admin-secret-123");

    expect(res.status).toBe(503);
  });

  it("keeps the in-memory fixture in test so the CRUD suite can exercise writes", async () => {
    // The fallback is load-bearing for the test suite; this guards the split so
    // the production 503 above cannot be "fixed" by deleting it.
    mockedState.mockReturnValue(0);

    const res = await request(app)
      .post("/api/projects")
      .set("x-admin-secret", "test-admin-secret-123")
      .send(validProject);

    expect(res.status).toBe(201);
  });
});

describe("Projects API - production must not fall back to process memory", () => {
  // A serverless instance boots with an empty in-memory array. In production,
  // "database unreachable" therefore means "no data", and answering 200 with an
  // empty array reports an outage as a successful empty portfolio.
  const originalNodeEnv = process.env.NODE_ENV;
  const originalSecret = process.env.ADMIN_SECRET;

  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.ADMIN_SECRET = originalSecret;
  });

  it("returns 503 when the database is not connected in production", async () => {
    process.env.NODE_ENV = "production";
    process.env.ADMIN_SECRET = "production-test-secret-at-least-32-chars";

    let prodApp: Express | undefined;
    let stateMock: jest.Mock | undefined;

    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const db = require("../src/config/db");
      stateMock = db.getConnectionState as jest.Mock;
      stateMock.mockReturnValue(0); // disconnected
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const models = require("../src/models/Project");
      (models.Project.find as jest.Mock).mockImplementation(() => {
        throw new Error("should not be reached while disconnected");
      });
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      prodApp = require("../src/app").createApp() as Express;
    });

    expect(prodApp).toBeDefined();
    const res = await request(prodApp as unknown as Express).get("/api/projects");

    expect(res.status).toBe(503);
  });

  it("does not report a failed admin write as a success in production", async () => {
    // A write parked in per-instance memory returns success, then vanishes on
    // the next cold start: the operator sees a saved project that is not there.
    process.env.NODE_ENV = "production";
    process.env.ADMIN_SECRET = "production-test-secret-at-least-32-chars";

    let prodApp: Express | undefined;

    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const db = require("../src/config/db");
      (db.getConnectionState as jest.Mock).mockReturnValue(1); // connected...
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const models = require("../src/models/Project");
      (models.Project.create as jest.Mock).mockRejectedValue(new Error("write concern failed"));
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      prodApp = require("../src/app").createApp() as Express;
    });

    const res = await request(prodApp as unknown as Express)
      .post("/api/projects")
      .set("x-admin-secret", "production-test-secret-at-least-32-chars")
      .send(validProject);

    expect(res.status).toBe(503);
  });
});
