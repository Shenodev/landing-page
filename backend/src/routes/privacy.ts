import { Router } from "express";
import { privacyLimiter } from "../middlewares/rate-limiters";
import { asyncHandler } from "../middlewares/async-handler";
import { postDeletionRequest, postUnsubscribe } from "../controllers/privacy.controller";

const router = Router();

router.post("/unsubscribe", privacyLimiter, asyncHandler(postUnsubscribe));
router.post("/privacy/deletion-request", privacyLimiter, asyncHandler(postDeletionRequest));

export default router;
