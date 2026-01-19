// src/app.ts  (updated – remove xss-clean)
import express, { Express } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
import morgan from 'morgan';
import hpp from 'hpp';
import rateLimit from 'express-rate-limit';
import {env} from './config/env';                // ← fixed lowercase 'env'
import logger from './utils/logger';
import { notFound, errorHandler } from './middleware/errorMiddleware';

// Routes placeholder...

const createApp = (): Express => {
  const app = express();

  app.use(helmet());
  
  app.use(cors({
    origin: env.isProd ? ['https://your-frontend-domain.com'] : true,
    credentials: true,
  }));

  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

  // removed: app.use(xss());   ← deprecated & unnecessary

  app.use(hpp());

  app.use(rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    message: { success: false, error: 'Too many requests — try again later' },
    standardHeaders: true,
    legacyHeaders: false,
  }));

  app.use(compression());

  if (env.isDev) {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined', { stream: { write: (msg) => logger.http(msg.trim()) } }));
  }

  // ... health route, notFound, errorHandler ...

  return app;
};

export default createApp;