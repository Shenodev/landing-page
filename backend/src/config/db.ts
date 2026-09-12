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
