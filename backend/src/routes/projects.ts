import { Router } from "express";
import { adminWriteLimiter, projectsLimiter } from "../middlewares/rate-limiters";
import { requireAdminSecret } from "../middlewares/auth";
import { projectUpload } from "../middlewares/uploads";
import { asyncHandler } from "../middlewares/async-handler";
import { deleteProjectById, getProjects, getProjectsAdmin, postProject, putProject } from "../controllers/projects.controller";

const router = Router();

// Public feed: same payload for every visitor, safe to cache at the edge.
router.get("/projects", projectsLimiter, asyncHandler(getProjects));
// Admin feed: the dashboard verifies the password with this read, so it must be
// guarded. The public route above cannot double as the verification call -
// it succeeds whatever secret is sent, which makes any password "valid".
// Declared before "/projects/:id" style routes and kept uncacheable.
router.get("/projects/admin", projectsLimiter, adminWriteLimiter, requireAdminSecret, asyncHandler(getProjectsAdmin));
router.post(
  "/projects",
  projectsLimiter,
  adminWriteLimiter,
  requireAdminSecret,
  projectUpload.array("images", 10),
  asyncHandler(postProject),
);
router.put(
  "/projects/:id",
  projectsLimiter,
  adminWriteLimiter,
  requireAdminSecret,
  projectUpload.array("images", 10),
  asyncHandler(putProject),
);
router.delete("/projects/:id", projectsLimiter, adminWriteLimiter, requireAdminSecret, asyncHandler(deleteProjectById));

export default router;
