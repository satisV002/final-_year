// src/app.ts
import express, { Express } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
import morgan from 'morgan';
import hpp from 'hpp';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import logger from './utils/logger';
import { notFound, errorHandler } from './middleware/errorMiddleware';
import { requestLogger } from './middleware/loggerMiddleware';
import groundwaterRouter from './routes/groundwater';
import authRouter from './routes/auth';

const createApp = (): Express => {
  const app = express();

  // Security headers
  app.use(helmet());

  // CORS
  app.use(cors({
    origin: env.isProd ? ['https://your-frontend-domain.com'] : true,
    credentials: true,
  }));

  // Body parsing
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

  // Security middlewares
  app.use(hpp());

  // Rate limiting (global)
  app.use(rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    message: { success: false, error: 'Too many requests — try again later' },
    standardHeaders: true,
    legacyHeaders: false,
  }));

  // Compression
  app.use(compression());

  // Logging
  if (env.isDev) {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined', { stream: { write: (msg) => logger.http(msg.trim()) } }));
  }

  // Request logging
  app.use(requestLogger);

  // Routes
  app.use('/api/v1/auth', authRouter);          // Public: Signup/Login
  app.use('/api/v1', groundwaterRouter);        // Groundwater endpoints

  // Health check
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
    });
  });

  // Test fast (no DB)
  app.get('/test-fast', (req, res) => {
    res.json({ message: 'This should be instant', time: new Date().toISOString() });
  });

  // ────────────────────────────────────────────────
  // TEMPORARY DEV ROUTE - Fetch WRIS data manually
  // Remove or comment out in production
  // ────────────────────────────────────────────────
  app.get('/dev/fetch-wris', async (req, res) => {
    try {
      const state = req.query.state as string;

      if (!state || typeof state !== 'string' || state.trim().length < 3) {
        return res.status(400).json({
          success: false,
          error: 'Valid state name is required (e.g., ?state=Telangana)'
        });
      }

      const { fetchAndSaveGroundwaterData } = await import('./services/fetchGroundwater');

      logger.info(`Manual WRIS fetch triggered for state: ${state}`);

      await fetchAndSaveGroundwaterData(state.trim());

      res.json({
        success: true,
        message: `Fetch & save attempted for state: ${state}`,
        note: 'Check server logs for number of records saved or errors'
      });
    } catch (err: any) {
      logger.error('Manual fetch failed', { error: err.message, stack: err.stack });
      res.status(500).json({
        success: false,
        error: 'Fetch failed - check server logs',
        details: err.message
      });
    }
  });

  // 404 handler (must be after all routes)
  app.use(notFound);

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
};

export default createApp;