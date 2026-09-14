import { Router } from "express";
import { contactLimiter } from "../middlewares/rate-limiters";
import { asyncHandler } from "../middlewares/async-handler";
import { postContact } from "../controllers/contact.controller";

const router = Router();

router.post("/contact", contactLimiter, asyncHandler(postContact));

export default router;