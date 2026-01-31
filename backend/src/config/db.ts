// src/config/db.ts
import mongoose from 'mongoose';
import { env } from './env';
import logger from '../utils/logger';

export const connectDB = async (): Promise<void> => {
  try {
    // Skip auto index creation in development (prevents slow startup & warnings)
    mongoose.set('autoIndex', env.isProd); // only create indexes in production

    await mongoose.connect(env.MONGODB_URI, {
      maxPoolSize: 50,
      minPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
      retryWrites: true,
      w: 'majority',
    });

    // Debug queries only in dev
    mongoose.set('debug', env.isDev);

    logger.info(`MongoDB Atlas connected → ${mongoose.connection.host}`);

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error', { error: err.message });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected - will auto-reconnect');
    });
  } catch (error: any) {
    logger.error('MongoDB connection failed', { error: error.message });
    process.exit(1);
  }
};