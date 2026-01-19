import mongoose from 'mongoose';
import {env} from './env';
import logger from '../utils/logger';

export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(env.MONGODB_URI, {
      maxPoolSize: 50,
      minPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,                  // Prefer IPv4
      retryWrites: true,          // Already in URI, but explicit
      w: 'majority',
    });

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