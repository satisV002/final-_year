import http from 'http';
import createApp from './app';
import { connectDB } from './config/db';
import { getRedisClient, closeRedis } from './config/redis';
import logger from './utils/logger';
import { env } from './config/env';
import mongoose from 'mongoose';

const app = createApp();
const server = http.createServer(app);

const startServer = async () => {
  try {
    await connectDB();

    // Redis connection (lazy, but test it here)
    const redis = await getRedisClient();
    logger.info('All services connected — server starting...');

    server.listen(env.PORT, () => {
      logger.info(`Server running → http://localhost:${env.PORT}`);
      logger.info(`Health: http://localhost:${env.PORT}/health`);
    });
  } catch (err: any) {
    logger.error('Server startup failed', { error: err.message });
    process.exit(1);
  }
};

const shutdown = async (signal: string) => {
  logger.info(`${signal} received — graceful shutdown starting...`);

  server.close(() => logger.info('HTTP server closed'));

  await closeRedis();

  await mongoose.connection.close().catch(e => logger.error('Mongo close error', { e }));

  logger.info('Shutdown complete');
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

startServer();