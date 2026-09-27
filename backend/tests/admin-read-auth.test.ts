import request from "supertest";
import { createApp } from "../src/app";
import { _clearMemoryProjects } from "../src/services/projects.service";

/**
 * The admin dashboard verifies the password by reading the project list. That
 * read must be guarded: an unguarded read means ANY password verifies, because
 * the request succeeds regardless of the secret.
 */
describe("Admin project read is guarded", () => {
  const app = createApp();
  const adminSecret = "test-admin-secret-123";

  beforeEach(() => {
    process.env.ADMIN_SECRET = adminSecret;
    _clearMemoryProjects();
  });

  it("keeps the public feed open and cacheable for the website", async () => {
    const res = await request(app).get("/api/projects");
    expect(res.status).toBe(200);
    expect(res.headers["cache-control"]).toContain("public");
  });

  it("rejects the admin read with no secret", async () => {
    const res = await request(app).get("/api/projects/admin");
    expect(res.status).toBe(401);
  });

  it("rejects the admin read with a wrong secret", async () => {
    const res = await request(app).get("/api/projects/admin").set("x-admin-secret", "not-the-secret");
    expect(res.status).toBe(401);
  });

  it("rejects a near-miss secret of the same length", async () => {
    const res = await request(app)
      .get("/api/projects/admin")
      .set("x-admin-secret", "test-admin-secret-124");
    expect(res.status).toBe(401);
  });

  it("allows the admin read with the real secret", async () => {
    const res = await request(app).get("/api/projects/admin").set("x-admin-secret", adminSecret);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("never marks the admin read publicly cacheable", async () => {
    const res = await request(app).get("/api/projects/admin").set("x-admin-secret", adminSecret);
    expect(res.headers["cache-control"] ?? "").not.toContain("public");
  });
});
