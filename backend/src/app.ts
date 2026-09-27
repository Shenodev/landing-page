import express, { Express } from "express";
import cors, { CorsOptions } from "cors";
import helmet from "helmet";
import { env, allowedOrigins } from "./config/env";
import {
  livenessHandler,
  healthHandler,
  rootIndexHandler,
  apiIndexHandler,
} from "./controllers/health.controller";
import contactRouter from "./routes/contact";
import discoveryRouter from "./routes/discovery";
import projectsRouter from "./routes/projects";
import calendlyRouter from "./routes/calendly";
import privacyRouter from "./routes/privacy";
import { notFoundHandler, globalErrorHandler } from "./middlewares/error-handler";
import { globalLimiter } from "./middlewares/rate-limiters";

const VERCEL_PREVIEW_ORIGIN = /^https:\/\/shenodev-.*\.vercel\.app$/;
const SHENODEV_SUBDOMAIN_ORIGIN = /^https:\/\/.*\.shenodev\.tech$/;
const DEV_LOCALHOST_ORIGIN = /^http:\/\/localhost:(3000|8081|5000)$/;

/**
 * Decide whether a request Origin may receive CORS response headers.
 *
 * Exported for direct unit testing: the cors package reports a denied origin
 * only by withholding headers, so the policy itself needs its own coverage.
 *
 * A missing Origin is allowed. Browsers always attach Origin to cross-origin
 * requests, so its absence means curl, an uptime monitor, or another
 * server-to-server client - not a cross-site browser request. Real gates are
 * the admin secret, the rate limiters, and schema validation.
 */
export const isOriginAllowed = (origin: string | undefined, isProd: boolean): boolean => {
  if (!origin) return true;

  // Configured origins come from ALLOWED_ORIGINS / FRONTEND_URL. Production
  // drops localhost entries so a dev origin can never be trusted in prod.
  const configured = (isProd ? allowedOrigins.filter((o) => !o.includes("localhost")) : allowedOrigins).filter(
    (o) => o === origin,
  );
  if (configured.length > 0) return true;

  if (VERCEL_PREVIEW_ORIGIN.test(origin)) return true;
  if (SHENODEV_SUBDOMAIN_ORIGIN.test(origin)) return true;
  if (!isProd && DEV_LOCALHOST_ORIGIN.test(origin)) return true;

  return false;
};

export const createApp = (): Express => {
  const app: Express = express();

  // Behind Vercel/Render, req.ip comes from X-Forwarded-For.
  // Without this, express-rate-limit sees one proxy IP for everyone
  // (either no throttling per attacker, or everyone blocked at once).
  app.set("trust proxy", 1);

  // Security headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // API-only, no need for CSP; Next.js handles own CSP
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    })
  );

  // Calendly webhooks - mounted BEFORE CORS and the global JSON parser because:
  // 1. Server-to-server POSTs from Calendly carry no Origin header (CORS would reject them in prod).
  // 2. HMAC signature verification needs the RAW body bytes, not parsed JSON.
  app.use("/api/calendly/webhook", express.raw({ type: "application/json", limit: "10kb" }));
  app.use("/api/calendly", calendlyRouter);

  // Public, read-only GET endpoints - mounted BEFORE CORS so health checks, uptime
  // monitors and direct browser navigation (which send no Origin header) always work
  // in production without being rejected by the CORS middleware.
  app.get("/", rootIndexHandler);
  app.get("/health", livenessHandler);
  app.get("/api", apiIndexHandler);
  app.get("/api/health", healthHandler);

  // CORS whitelist - strict production standard: ONLY allowed origins + FRONTEND_URL env var
  // Also supports Vercel preview deployments (e.g., https://shenodev-*.vercel.app)
  const corsOptions: CorsOptions = {
    // A denied origin is a policy decision, not a server fault. Passing
    // `false` makes cors omit the response headers so the browser blocks the
    // read, while the route still answers normally. Passing an Error here
    // (the previous behaviour) made cors rethrow into the error handler and
    // turned every denied origin - including a curl request with no Origin -
    // into a 500.
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      const allowed: boolean = isOriginAllowed(origin, env.NODE_ENV === "production");
      if (allowed) {
        callback(null, true);
        return;
      }
      console.warn(`[cors] Blocked origin: ${origin}`);
      callback(null, false);
    },
    credentials: true,
    // GET/POST/OPTIONS only broke browser admin edits: PUT and DELETE are real
    // routes, so a preflight asking for them was answered without those methods
    // and the browser refused the request before it reached the handler.
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    // x-admin-secret is required for the hidden admin upload — without it,
    // browsers block cross-origin admin POSTs at preflight.
    allowedHeaders: ["Content-Type", "Authorization", "x-admin-secret"],
    maxAge: 86400,
  };
  app.use(cors(corsOptions));

  // Global rate limiting (100 req / 15min per IP) - protects all routes
  app.use("/api", globalLimiter);

  app.use(express.json({ limit: "10kb" }));
  app.use(express.urlencoded({ extended: true, limit: "10kb" }));

  // Business API routes
  app.use("/api", contactRouter);
  app.use("/api", discoveryRouter);
  app.use("/api", projectsRouter);
  app.use("/api", privacyRouter);

  // 404 handler - must be after all routes
  app.use(notFoundHandler);

  // Global error handler
  app.use(globalErrorHandler);

  return app;
};

export default createApp;