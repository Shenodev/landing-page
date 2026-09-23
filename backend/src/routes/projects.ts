import { Router } from "express";
import { adminWriteLimiter, projectsLimiter } from "../middlewares/rate-limiters";
import { requireAdminSecret } from "../middlewares/auth";
import { projectUpload } from "../middlewares/uploads";
import { asyncHandler } from "../middlewares/async-handler";
import { deleteProjectById, getProjects, postProject, putProject } from "../controllers/projects.controller";

const router = Router();

router.get("/projects", projectsLimiter, asyncHandler(getProjects));
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
