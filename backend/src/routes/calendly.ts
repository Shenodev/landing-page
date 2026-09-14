import { Router } from "express";
import { webhookLimiter } from "../middlewares/rate-limiters";
import { asyncHandler } from "../middlewares/async-handler";
import { postCalendlyWebhook } from "../controllers/calendly.controller";

const router = Router();

router.post("/webhook", webhookLimiter, asyncHandler(postCalendlyWebhook));

export default router;