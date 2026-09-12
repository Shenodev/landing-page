import { Router, Request, Response } from 'express';
import { getConnectionState } from '../config/db';

const router = Router();

router.get('/health', (_req: Request, res: Response): void => {
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
});

export default router;
