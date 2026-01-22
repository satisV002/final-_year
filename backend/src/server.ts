// src/server.ts
import http from 'http';
import app from './app';
import { connectDB } from './config/db';
import { getRedisClient, closeRedis } from './config/redis';
import logger from './utils/logger';
import {env} from './config/env';
import mongoose from 'mongoose';
import { setupDailyFetchCron } from './cron/dailyFetch';

const server = http.createServer(app);

const startServer = async () => {
  try {
    await connectDB();
    await getRedisClient();
    logger.info('All services connected — starting server...');

    // Start the daily cron job
    setupDailyFetchCron();

    server.listen(env.PORT, () => {
      logger.info(`Server running → http://localhost:${env.PORT}`);
      logger.info(`Health check: http://localhost:${env.PORT}/health`);
    });
  } catch (err: any) {
    logger.error('Server startup failed', { error: err.message });
    process.exit(1);
  }
};

const shutdown = async (signal: string) => {
  logger.info(`${signal} received — graceful shutdown...`);
  server.close(() => logger.info('HTTP server closed'));
  await closeRedis().catch(e => logger.error('Redis close error', { e }));
  await mongoose.connection.close().catch(e => logger.error('Mongo close error', { e }));
  logger.info('Shutdown complete');
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

startServer();