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
import { notFoundHandler, globalErrorHandler } from "./middlewares/error-handler";
import { globalLimiter } from "./middlewares/rate-limiters";

export const createApp = (): Express => {
  const app: Express = express();

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
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      const isProd = env.NODE_ENV === "production";

      // Build allowed origins list dynamically - filter out localhost in production
      const prodOrigins = allowedOrigins.filter(o => !o.includes("localhost"));
      const allowed = isProd
        ? [
            ...prodOrigins, // from ALLOWED_ORIGINS env var (no localhost)
            ...(env.FRONTEND_URL ? [env.FRONTEND_URL.trim()] : []),
            // Support Vercel preview deployments: https://shenodev-*.vercel.app
            /^https:\/\/shenodev-.*\.vercel\.app$/,
            // Support any shenodev.tech subdomain
            /^https:\/\/.*\.shenodev\.tech$/,
            
          ]
        : [
            ...allowedOrigins, // from ALLOWED_ORIGINS env var (includes localhost for dev)
            ...(env.FRONTEND_URL ? [env.FRONTEND_URL] : []),
            // Support Vercel preview deployments: https://shenodev-*.vercel.app
            /^https:\/\/shenodev-.*\.vercel\.app$/,
            // Support any shenodev.tech subdomain
            /^https:\/\/.*\.shenodev\.tech$/,
            
          ];

      // In production, reject requests with no origin
      if (!origin) {
        if (isProd) {
          callback(new Error("CORS: No origin in production"));
          return;
        }
        callback(null, true);
        return;
      }

      if (allowed.includes(origin)) {
        callback(null, true);
        return;
      }

      // Development: allow localhost on common ports
      if (!isProd && /^http:\/\/localhost:(3000|8081|5000)$/.test(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"], // Only allow necessary methods
    allowedHeaders: ["Content-Type", "Authorization"],
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

  // 404 handler - must be after all routes
  app.use(notFoundHandler);

  // Global error handler
  app.use(globalErrorHandler);

  return app;
};

export default createApp;