import express, { Express, Request, Response } from 'express';
import cors, { CorsOptions } from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env, allowedOrigins } from './config/env';
import healthRouter from './routes/health';
import contactRouter from './routes/contact';
import discoveryRouter from './routes/discovery';
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

  // CORS whitelist - senior production standard (no origin:true)
  const corsOptions: CorsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow non-browser requests (curl, mobile) with no origin, and allowed list
      if (!origin) {
        callback(null, true);
        return;
      }
      if (allowedOrigins.includes(origin) || (env.NODE_ENV === 'development' && origin.startsWith('http://localhost'))) {
        callback(null, true);
        return;
      }
      // Allow Expo Go exp:// and null for dev
      if (origin.startsWith('exp://') || origin.startsWith('http://192.168.')) {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
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

  // 404 handler - must be after all routes
  app.use(notFoundHandler);

  // Global error handler
  app.use(globalErrorHandler);

  return app;
};

export default createApp;
