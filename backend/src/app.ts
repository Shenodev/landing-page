import express, { Express, Request, Response } from 'express';
import cors, { CorsOptions } from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env, allowedOrigins } from './config/env';
import healthRouter from './routes/health';
import contactRouter from './routes/contact';
import discoveryRouter from './routes/discovery';
import projectsRouter from './routes/projects';
import calendlyRouter from './routes/calendly';
import { notFoundHandler, globalErrorHandler } from './middleware/errorHandler';

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
  app.use('/api/calendly/webhook', express.raw({ type: 'application/json', limit: '10kb' }));
  app.use('/api/calendly', calendlyRouter);

  // CORS whitelist - strict production standard: ONLY allowed origins + FRONTEND_URL env var
  // Also supports Vercel preview deployments (e.g., https://shenodev-*.vercel.app)
  const corsOptions: CorsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      const isProd = env.NODE_ENV === 'production';

      // Build allowed origins list dynamically - filter out localhost in production
      const prodOrigins = allowedOrigins.filter(o => !o.includes('localhost'));
      const allowed = isProd
        ? [
            ...prodOrigins, // from ALLOWED_ORIGINS env var (no localhost)
            ...(env.FRONTEND_URL ? [env.FRONTEND_URL.trim()] : []),
            // Support Vercel preview deployments: https://shenodev-*.vercel.app
            /^https:\/\/shenodev-.*\.vercel\.app$/,
            // Support any shenodev.tech subdomain
            /^https:\/\/.*\.shenodev\.tech$/,
            // Support shenodev.dpdns.org and its subdomains (new production domains)
            /^https:\/\/.*\.shenodev\.dpdns\.org$/,
          ]
        : [
            ...allowedOrigins, // from ALLOWED_ORIGINS env var (includes localhost for dev)
            ...(env.FRONTEND_URL ? [env.FRONTEND_URL] : []),
            // Support Vercel preview deployments: https://shenodev-*.vercel.app
            /^https:\/\/shenodev-.*\.vercel\.app$/,
            // Support any shenodev.tech subdomain
            /^https:\/\/.*\.shenodev\.tech$/,
            // Support shenodev.dpdns.org and its subdomains (new production domains)
            /^https:\/\/.*\.shenodev\.dpdns\.org$/,
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
    methods: ['GET', 'POST', 'OPTIONS'], // Only allow necessary methods
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  };
  app.use(cors(corsOptions));

  // Global rate limiting (100 req / 15min per IP) - protects all routes
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: env.NODE_ENV === 'test' ? 1000 : 100,
    message: { error: 'Too Many Requests', message: 'Please try again later', statusCode: 429 },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api', globalLimiter);

  app.use(express.json({ limit: "10kb" }));
  app.use(express.urlencoded({ extended: true, limit: "10kb" }));

  // Root health check (simple, no DB dependency for load balancer)
  app.get('/health', (_req: Request, res: Response): void => {
    res.status(200).json({
      status: 'ok',
      service: 'shenodev-backend',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // API routes
  app.get('/api', (_req: Request, res: Response): void => {
    res.status(200).json({
      message: 'ShenoDev API v1',
      service: 'shenodev-backend',
      endpoints: ['/health', '/api/health', '/api'],
    });
  });

  app.use('/api', healthRouter);
  app.use('/api', contactRouter);
  app.use('/api', discoveryRouter);
  app.use('/api', projectsRouter);

  // 404 handler - must be after all routes
  app.use(notFoundHandler);

  // Global error handler
  app.use(globalErrorHandler);

  return app;
};

export default createApp;
