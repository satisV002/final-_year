import { cleanEnv, str, num, url } from 'envalid';
import dotenv from 'dotenv';

dotenv.config();

const envVars = cleanEnv(process.env, {
  NODE_ENV: str({ choices: ['development', 'production', 'test'] as const }),
  PORT: num({ default: 5000 }),
  MONGODB_URI: url({ desc: 'MongoDB Atlas connection string required' }),
  REDIS_URL: url({ default: 'redis://localhost:6379' }),
  LOG_LEVEL: str({ choices: ['error', 'warn', 'info', 'http', 'debug'] as const, default: 'info' }),
  RATE_LIMIT_WINDOW_MS: num({ default: 15 * 60 * 1000 }),
  RATE_LIMIT_MAX: num({ default: 100 }),
});

export const env = {
  ...envVars,
  isDev: envVars.NODE_ENV === 'development',
  isProd: envVars.NODE_ENV === 'production',
  isTest: envVars.NODE_ENV === 'test',
} as const;