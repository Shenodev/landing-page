import request from "supertest";
import { createApp, isOriginAllowed } from "../src/app";

/**
 * CORS policy must never turn into a 500. A rejected origin is a policy
 * decision, not a server fault: respond without Access-Control-Allow-Origin
 * so the browser blocks it, and let the route answer normally otherwise.
 */
describe("CORS policy", () => {
  describe("isOriginAllowed", () => {
    it("allows the configured production frontend", () => {
      expect(isOriginAllowed("https://shenodev.tech", true)).toBe(true);
      expect(isOriginAllowed("https://shenodev.tech", false)).toBe(true);
    });

    it("allows shenodev.tech subdomains and Vercel previews", () => {
      expect(isOriginAllowed("https://api.shenodev.tech", true)).toBe(true);
      expect(isOriginAllowed("https://shenodev-git-main.vercel.app", true)).toBe(true);
    });

    it("allows a missing Origin (curl, uptime monitors, server-to-server)", () => {
      // Browsers always attach Origin to cross-origin requests, so a missing
      // one is not a cross-site browser request. Real gates are the admin
      // secret and the rate limiters.
      expect(isOriginAllowed(undefined, true)).toBe(true);
      expect(isOriginAllowed("", true)).toBe(true);
    });

    it("denies unrelated origins in production", () => {
      expect(isOriginAllowed("https://evil.example", true)).toBe(false);
      expect(isOriginAllowed("http://localhost:3000", true)).toBe(false);
      expect(isOriginAllowed("http://shenodev.tech.evil.example", true)).toBe(false);
    });

    it("denies unrelated origins in development", () => {
      expect(isOriginAllowed("https://evil.example", false)).toBe(false);
    });
  });

  describe("middleware behaviour", () => {
    const app = createApp();

    it("does not 500 when the request carries no Origin header", async () => {
      const res = await request(app).get("/api/projects");
      expect(res.status).toBe(200);
    });

    it("omits Access-Control-Allow-Origin for a denied origin", async () => {
      const res = await request(app).get("/api/projects").set("Origin", "https://evil.example");
      expect(res.status).not.toBe(500);
      expect(res.headers["access-control-allow-origin"]).toBeUndefined();
    });

    it("echoes Access-Control-Allow-Origin for an allowed origin", async () => {
      const res = await request(app).get("/api/projects").set("Origin", "https://shenodev.tech");
      expect(res.status).toBe(200);
      expect(res.headers["access-control-allow-origin"]).toBe("https://shenodev.tech");
    });

    it("allows PUT and DELETE in preflight so browser admin edits work", async () => {
      for (const method of ["PUT", "DELETE"]) {
        const res = await request(app)
          .options("/api/projects/507f1f77bcf86cd799439011")
          .set("Origin", "https://shenodev.tech")
          .set("Access-Control-Request-Method", method);
        expect(res.headers["access-control-allow-methods"]).toContain(method);
      }
    });

    it("answers 401 (not 500) for a bad admin secret sent from a denied origin", async () => {
      const res = await request(app)
        .post("/api/projects")
        .set("Origin", "https://evil.example")
        .set("x-admin-secret", "wrong-secret")
        .send({ title: "x" });
      expect(res.status).not.toBe(500);
    });
  });
});
