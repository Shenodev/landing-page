import { Router, Request, Response } from 'express';
import { getConnectionState } from '../config/db';

// Liveness: always "ok", no DB dependency (load balancer / uptime monitors).
export const livenessHandler = (_req: Request, res: Response): void => {
  res.status(200).json({
    status: 'ok',
    service: 'shenodev-backend',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
};

// Readiness: reports DB connection state (ok/degraded).
export const healthHandler = (_req: Request, res: Response): void => {
  const dbState = getConnectionState();
  const dbStatusMap: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const dbStatus: string = dbStatusMap[dbState] ?? 'unknown';
  const status: 'ok' | 'degraded' = dbState === 1 ? 'ok' : 'degraded';

  res.status(200).json({
    status,
    db: dbStatus,
    service: 'shenodev-backend',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
};

// Friendly browser landing for the API domain.
export const rootIndexHandler = (_req: Request, res: Response): void => {
  res.status(200).json({
    service: 'shenodev-backend',
    version: '1.0.0',
    message: 'ShenoDev API v1',
    endpoints: ['/health', '/api', '/api/health', '/api/discovery', '/api/projects'],
  });
};

// API index listing.
export const apiIndexHandler = (_req: Request, res: Response): void => {
  res.status(200).json({
    message: 'ShenoDev API v1',
    service: 'shenodev-backend',
    endpoints: ['/health', '/api/health', '/api'],
  });
};

const router = Router();
router.get('/health', healthHandler);
router.get('/', rootIndexHandler);
router.get('/api', apiIndexHandler);

export default router;