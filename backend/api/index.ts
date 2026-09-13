import { createApp } from './app';
import { connectDB } from './config/db';
import { env } from './config/env';

// Initialize the Express app
const app = createApp();

// Connect to database (handled gracefully - won't block if DB is unavailable)
let dbConnected = false;

async function connectToDatabase() {
  try {
    await import('./config/db').then(({ connectDB }) => connectDB());
    console.log('[vercel] Database connected successfully');
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn(`[vercel] DB connection failed - running in degraded mode: ${msg}`);
  }
}

// Connect to DB on cold start (Vercel cold start)
connectToDatabase();

// Export the Express app as a serverless function handler
// Vercel will invoke this handler for each request
export default async function handler(req: any, res: any) {
  return app(req, res);
}

// For local development
if (require.main === module) {
  const PORT = process.env.PORT ?? 5000;
  const app = require('./app').createApp();
  const PORT_NUM = parseInt(process.env.PORT || '5000', 10);
  
  const server = app.listen(PORT_NUM, () => {
    console.log(`[local] Server running on http://localhost:${PORT_NUM}`);
  });
}

export { createApp } from './app';
export { connectDB } from './config/db';
export { env } from './config/env';