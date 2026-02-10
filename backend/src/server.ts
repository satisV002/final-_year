import http from 'http';
import createApp from './app';
import { connectDB } from './config/db';
import { getRedisClient, closeRedis } from './config/redis';
import logger from './utils/logger';
import { env } from './config/env';
import mongoose from 'mongoose';
import { setupDailyFetchCron } from './cron/dailyFetch';

const app = createApp();          // ✅ FIX
const server = http.createServer(app);

const startServer = async () => {
  try {
    if (!env.isTest) {
      await connectDB();
      await getRedisClient();

      if (env.isProd) {
        setupDailyFetchCron();
      }

      logger.info('DB + Redis connected');
    } else {
      logger.info('TEST MODE → DB / Redis / Cron skipped');
    }

    server.listen(env.PORT, () => {
      logger.info(`Server running → http://localhost:${env.PORT}`);
    });
  } catch (err: any) {
    logger.error('Server startup failed', { error: err.message });
    process.exit(1);
  }
};

const shutdown = async (signal: string) => {
  logger.info(`${signal} received — shutting down...`);
  server.close();

  if (!env.isTest) {
    await closeRedis().catch(() => {});
    await mongoose.connection.close().catch(() => {});
  }

  process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

startServer();
