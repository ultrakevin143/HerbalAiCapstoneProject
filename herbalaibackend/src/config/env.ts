import dotenv from 'dotenv';
import process from 'node:process';
dotenv.config();

const boundedInteger = (name: string, fallback: number, minimum: number, maximum: number) => {
  const parsed = Number.parseInt(process.env[name] ?? '', 10);
  return Number.isFinite(parsed) ? Math.min(maximum, Math.max(minimum, parsed)) : fallback;
};

export const ENV = {
  APP_NAME: process.env['APP_NAME'] || 'Herbal AI',
  PORT: parseInt(process.env['PORT'] || '5000', 10),
  NODE_ENV: process.env['NODE_ENV'] || 'development',
  DATABASE_URL: process.env['DATABASE_URL'],
  DB_POOL_MIN: boundedInteger('DB_POOL_MIN', 2, 0, 20),
  DB_POOL_MAX: boundedInteger('DB_POOL_MAX', 10, 1, 100),
  DB_POOL_IDLE_TIMEOUT_MS: boundedInteger('DB_POOL_IDLE_TIMEOUT_MS', 300_000, 1_000, 600_000),
  DB_POOL_CONNECTION_TIMEOUT_MS: boundedInteger('DB_POOL_CONNECTION_TIMEOUT_MS', 10_000, 500, 60_000),
  DB_POOL_MAX_LIFETIME_SECONDS: boundedInteger('DB_POOL_MAX_LIFETIME_SECONDS', 1_800, 60, 86_400),
  DB_POOL_METRICS_INTERVAL_MS: boundedInteger('DB_POOL_METRICS_INTERVAL_MS', 60_000, 0, 3_600_000),
  AUTH_USER_CACHE_TTL_MS: boundedInteger('AUTH_USER_CACHE_TTL_MS', 5_000, 0, 60_000),
  AUTH_USER_CACHE_MAX_ENTRIES: boundedInteger('AUTH_USER_CACHE_MAX_ENTRIES', 2_000, 1, 100_000),
  JWT_SECRET: process.env['JWT_SECRET'] || 'herbalai_access_secret_change_in_prod',
  JWT_REFRESH_SECRET: process.env['JWT_REFRESH_SECRET'] || 'herbalai_refresh_secret_change_in_prod',
  FRONTEND_URL: process.env['FRONTEND_URL'] || 'http://localhost:3000',
  BACKEND_URL: process.env['BACKEND_URL'] || 'http://localhost:5000',
  GEMINI_API_KEY: process.env['GEMINI_API_KEY'],
  DR_AI_CHAT_MODELS: (process.env['DR_AI_CHAT_MODELS'] || 'gemini-3.5-flash-lite,gemini-3.6-flash,gemini-2.5-flash-lite')
    .split(',')
    .map((model) => model.trim())
    .filter(Boolean),
  DR_AI_MODEL_TIMEOUT_MS: boundedInteger('DR_AI_MODEL_TIMEOUT_MS', 7_000, 1_000, 20_000),
  GOOGLE_CLIENT_ID: process.env['GOOGLE_CLIENT_ID'] || '',
  GOOGLE_CLIENT_SECRET: process.env['GOOGLE_CLIENT_SECRET'] || '',
  CLOUDINARY_CLOUD_NAME: process.env['CLOUDINARY_CLOUD_NAME'] || '',
  CLOUDINARY_API_KEY: process.env['CLOUDINARY_API_KEY'] || '',
  CLOUDINARY_API_SECRET: process.env['CLOUDINARY_API_SECRET'] || '',
  SMTP_HOST: process.env['SMTP_HOST'] || 'smtp.gmail.com',
  SMTP_PORT: parseInt(process.env['SMTP_PORT'] || '587', 10),
  SMTP_USER: process.env['SMTP_USER'] || '',
  SMTP_PASSWORD: process.env['SMTP_PASSWORD'] || '',
  SMTP_FROM: process.env['SMTP_FROM'] || '',
  EMAIL_DELIVERY_MODE: process.env['EMAIL_DELIVERY_MODE'] || (process.env['NODE_ENV'] === 'production' ? 'live' : 'log'),
  EMAIL_ALLOWED_RECIPIENTS: (process.env['EMAIL_ALLOWED_RECIPIENTS'] || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
};

if (ENV.NODE_ENV === 'production') {
  if (ENV.JWT_SECRET === 'herbalai_access_secret_change_in_prod') {
    console.warn('⚠️ WARNING: Using default JWT_SECRET in production is insecure. Please set JWT_SECRET in .env');
  }
  if (ENV.JWT_REFRESH_SECRET === 'herbalai_refresh_secret_change_in_prod') {
    console.warn('⚠️ WARNING: Using default JWT_REFRESH_SECRET in production is insecure. Please set JWT_REFRESH_SECRET in .env');
  }
}
