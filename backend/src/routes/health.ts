import { Router } from "express";
import { healthHandler, rootIndexHandler, apiIndexHandler } from "../controllers/health.controller";

const router = Router();

router.get("/health", healthHandler);
router.get("/", rootIndexHandler);
router.get("/api", apiIndexHandler);

export default router;