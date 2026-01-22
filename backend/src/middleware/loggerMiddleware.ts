// src/middlewares/loggerMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.http(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`, {
      ip: req.ip,
      userAgent: req.get('user-agent') || 'unknown',
      query: req.query,
    });
  });

  next();
};