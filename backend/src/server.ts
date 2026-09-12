import dotenv from 'dotenv';
import { createApp } from './app';
import { connectDB } from './config/db';

dotenv.config();

const PORT: number = parseInt(process.env.PORT ?? '4000', 10);
const NODE_ENV: string = process.env.NODE_ENV ?? 'development';

const startServer = async (): Promise<void> => {
  try {
    await connectDB();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[server] DB connection failed - starting in degraded mode: ${message}`);
    // Continue bootstrapping even if DB is down - health endpoint will report degraded
  }

  const app = createApp();

  const server = app.listen(PORT, () => {
    console.log(`[server] ShenoDev Backend running on http://localhost:${PORT} [${NODE_ENV}]`);
    console.log(`[server] Health: http://localhost:${PORT}/health`);
    console.log(`[server] API Health: http://localhost:${PORT}/api/health`);
  });

  const gracefulShutdown = async (signal: string): Promise<void> => {
    console.log(`[server] Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      try {
        const { disconnectDB } = await import('./config/db');
        await disconnectDB();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[server] Error during DB disconnect: ${msg}`);
      }
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => void gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => void gracefulShutdown('SIGINT'));

  process.on('unhandledRejection', (reason: unknown) => {
    const msg = reason instanceof Error ? reason.message : String(reason);
    console.error(`[server] Unhandled Rejection: ${msg}`);
  });

  process.on('uncaughtException', (err: Error) => {
    console.error(`[server] Uncaught Exception: ${err.message}`, err.stack);
    void gracefulShutdown('uncaughtException');
  });
};

void startServer();

export { startServer };
