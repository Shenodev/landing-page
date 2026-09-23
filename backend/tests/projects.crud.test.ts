import request from "supertest";
import { createApp } from "../src/app";
import { _clearMemoryProjects } from "../src/services/projects.service";
import { _disconnectRedisForTest } from "../src/config/redis";

const validProject = {
  title: "Crud Project",
  description: "A project used to verify update and delete flows end to end.",
  imageUrl: "https://cdn.shenodev.tech/projects/crud.jpg",
  techStack: ["Next.js", "Node.js"],
  demoUrl: "https://demo.shenodev.tech/crud",
  githubUrl: "",
};

describe("Projects API - update / delete / cache headers", () => {
  const app = createApp();
  const adminSecret = "test-admin-secret-123";

  beforeEach(() => {
    process.env.ADMIN_SECRET = adminSecret;
    delete process.env.REDIS_URL;
    _clearMemoryProjects();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await _disconnectRedisForTest();
  });

  it("GET /api/projects sets public Cache-Control for browser + CDN", async () => {
    const res = await request(app).get("/api/projects");
    expect(res.status).toBe(200);
    expect(res.headers["cache-control"]).toMatch(/public/);
    expect(res.headers["cache-control"]).toMatch(/s-maxage=60/);
  });

  it("PUT rejects without secret (401), malformed id (400), unknown id (404)", async () => {
    const noAuth = await request(app).put("/api/projects/507f1f77bcf86cd799439011").send({ title: "x" });
    expect(noAuth.status).toBe(401);

    const badId = await request(app)
      .put("/api/projects/not-an-id")
      .set("x-admin-secret", adminSecret)
      .send({ title: "New Title Here" });
    expect(badId.status).toBe(400);

    const missing = await request(app)
      .put("/api/projects/507f1f77bcf86cd799439011")
      .set("x-admin-secret", adminSecret)
      .send({
        title: "Ghost Title",
        description: "This project does not exist anywhere at all.",
        imageUrl: "https://cdn.shenodev.tech/projects/ghost.jpg",
        techStack: ["Next.js"],
      });
    expect(missing.status).toBe(404);
  });

  it("PUT applies a partial update and keeps the stored gallery", async () => {
    const created = await request(app).post("/api/projects").set("x-admin-secret", adminSecret).send(validProject);
    expect(created.status).toBe(201);
    const id: string = created.body.data._id as string;

    const updated = await request(app)
      .put(`/api/projects/${id}`)
      .set("x-admin-secret", adminSecret)
      .send({ title: "Crud Project Renamed" });
    expect(updated.status).toBe(200);
    expect(updated.body.data.title).toBe("Crud Project Renamed");
    expect(updated.body.data.description).toBe(validProject.description);
    expect(updated.body.data.imageUrl).toBe(validProject.imageUrl);
  });

  it("PUT replaces the gallery when images are supplied", async () => {
    const created = await request(app).post("/api/projects").set("x-admin-secret", adminSecret).send(validProject);
    const id: string = created.body.data._id as string;

    const updated = await request(app)
      .put(`/api/projects/${id}`)
      .set("x-admin-secret", adminSecret)
      .send({
        images: [{ url: "https://cdn.shenodev.tech/projects/crud-b.jpg", publicId: "" }],
      });
    expect(updated.status).toBe(200);
    expect(updated.body.data.imageUrl).toBe("https://cdn.shenodev.tech/projects/crud-b.jpg");
  });

  it("PUT rejects invalid payloads with 400", async () => {
    const created = await request(app).post("/api/projects").set("x-admin-secret", adminSecret).send(validProject);
    const id: string = created.body.data._id as string;

    const res = await request(app)
      .put(`/api/projects/${id}`)
      .set("x-admin-secret", adminSecret)
      .send({ title: "x" });
    expect(res.status).toBe(400);
  });

  it("DELETE removes the project; second delete is 404; GET is empty after", async () => {
    const created = await request(app).post("/api/projects").set("x-admin-secret", adminSecret).send(validProject);
    const id: string = created.body.data._id as string;

    const noAuth = await request(app).delete(`/api/projects/${id}`);
    expect(noAuth.status).toBe(401);

    const deleted = await request(app).delete(`/api/projects/${id}`).set("x-admin-secret", adminSecret);
    expect(deleted.status).toBe(200);
    expect(deleted.body.data.id).toBe(id);

    const again = await request(app).delete(`/api/projects/${id}`).set("x-admin-secret", adminSecret);
    expect(again.status).toBe(404);

    const list = await request(app).get("/api/projects");
    expect(list.body.data).toHaveLength(0);
  });

  it("DELETE rejects malformed id with 400", async () => {
    const res = await request(app).delete("/api/projects/nope").set("x-admin-secret", adminSecret);
    expect(res.status).toBe(400);
  });
});
