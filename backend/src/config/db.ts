import mongoose from 'mongoose';
import { env } from './env';

const MONGODB_URI: string = env.MONGODB_URI;

/**
 * Connect to MongoDB using Mongoose.
 * Idempotent - returns existing connection if already connected.
 */
export const connectDB = async (): Promise<typeof mongoose> => {
  const readyState = mongoose.connection.readyState;

  // 1 = connected, 2 = connecting
  if (readyState === 1 || readyState === 2) {
    return mongoose;
  }

  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    console.log(`[db] Connected to MongoDB: ${mongoose.connection.host}`);
    return mongoose;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[db] MongoDB connection error: ${message}`);
    throw error;
  }
};

/**
 * Gracefully disconnect from MongoDB.
 */
export const disconnectDB = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('[db] Disconnected from MongoDB');
  }
};

/**
 * Get current Mongoose connection readyState.
 * 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
 */
export const getConnectionState = (): number => {
  return mongoose.connection.readyState;
};

export const getMongoose = (): typeof mongoose => mongoose;

// Serverless-friendly connection: retries on every request until Mongo is
// reachable instead of pinning a lambda instance to "disconnected forever".
// Resets the in-flight promise on BOTH success and failure so a later request
// re-attempts whenever readyState is not "connected". connect() is injectable
// for tests; it defaults to a real connectDB() call.
let dbConnectPromise: Promise<boolean> | null = null;

export const connectOnDemand = async (connect: () => Promise<unknown> = connectDB): Promise<boolean> => {
  if (getConnectionState() === 1) return true;
  if (dbConnectPromise) return dbConnectPromise;

  dbConnectPromise = connect()
    .then(() => {
      dbConnectPromise = null;
      return true;
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[db] Connection failed - will retry on next request: ${message}`);
      dbConnectPromise = null;
      return false;
    });

  return dbConnectPromise;
};
