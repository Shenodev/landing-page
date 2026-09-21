import { Router } from "express";
import { adminWriteLimiter, projectsLimiter } from "../middlewares/rate-limiters";
import { requireAdminSecret } from "../middlewares/auth";
import { projectUpload } from "../middlewares/uploads";
import { asyncHandler } from "../middlewares/async-handler";
import { getProjects, postProject } from "../controllers/projects.controller";

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

export default router;