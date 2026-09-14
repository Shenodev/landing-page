import { Router } from "express";
import { discoveryLimiter } from "../middlewares/rate-limiters";
import { discoveryUpload } from "../middlewares/uploads";
import { asyncHandler } from "../middlewares/async-handler";
import { postDiscovery } from "../controllers/discovery.controller";

const router = Router();

router.post(
  "/discovery",
  discoveryLimiter,
  discoveryUpload.fields([
    { name: "attachments", maxCount: 10 },
    { name: "attachment", maxCount: 1 },
  ]),
  asyncHandler(postDiscovery),
);

export default router;