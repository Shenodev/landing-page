import rateLimit from "express-rate-limit";
import { env } from "../config/env";

const envMax = (prodMax: number, testMax: number): number =>
  env.NODE_ENV === "test" ? testMax : prodMax;

/** Global limiter: 100 req / 15 min per IP (mounted on /api). */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: envMax(100, 1000),
  message: { error: "Too Many Requests", message: "Please try again later", statusCode: 429 },
  standardHeaders: true,
  legacyHeaders: false,
});

/** Contact: 10 req / 60s per IP (high volume TDD: 1000). */
export const contactLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: envMax(10, 1000),
  message: { error: "Too many requests", message: "Please try again after a minute", statusCode: 429 },
  standardHeaders: true,
  legacyHeaders: false,
});

/** Discovery: 10 req / 60s per IP (high volume TDD: 1000). */
export const discoveryLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: envMax(10, 1000),
  message: { error: "Too many requests", message: "Please try again after a minute", statusCode: 429 },
  standardHeaders: true,
  legacyHeaders: false,
});

/** Projects: 100 req / 60s per IP (high volume TDD: 1000). */
export const projectsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: envMax(100, 1000),
  message: { error: "Too Many Requests", message: "Please try again later", statusCode: 429 },
  standardHeaders: true,
  legacyHeaders: false,
});

/** Calendly webhook: generous limit - Calendly can burst + retry with backoff. */
export const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: envMax(120, 10000),
  message: { error: "Too Many Requests", message: "Calendly webhook rate limited", statusCode: 429 },
  standardHeaders: true,
  legacyHeaders: false,
});