import dotenv from 'dotenv';
import process from 'node:process';
import { normalizeDatabaseUrl } from './database-url.js';
dotenv.config();

const boundedInteger = (name: string, fallback: number, minimum: number, maximum: number) => {
  const parsed = Number.parseInt(process.env[name] ?? '', 10);
  return Number.isFinite(parsed) ? Math.min(maximum, Math.max(minimum, parsed)) : fallback;
};

export const ENV = {
  APP_NAME: process.env['APP_NAME'] || 'Herbal-Ai',
  PORT: parseInt(process.env['PORT'] || '5000', 10),
  NODE_ENV: process.env['NODE_ENV'] || 'development',
  DATABASE_URL: normalizeDatabaseUrl(process.env['DATABASE_URL']),
  DB_POOL_MIN: boundedInteger('DB_POOL_MIN', 2, 0, 20),
  DB_POOL_MAX: boundedInteger('DB_POOL_MAX', 10, 1, 100),
  DB_POOL_IDLE_TIMEOUT_MS: boundedInteger('DB_POOL_IDLE_TIMEOUT_MS', 300_000, 1_000, 600_000),
  DB_POOL_CONNECTION_TIMEOUT_MS: boundedInteger('DB_POOL_CONNECTION_TIMEOUT_MS', 10_000, 500, 60_000),
  DB_TRANSACTION_MAX_WAIT_MS: boundedInteger('DB_TRANSACTION_MAX_WAIT_MS', 12_000, 1_000, 60_000),
  DB_POOL_MAX_LIFETIME_SECONDS: boundedInteger('DB_POOL_MAX_LIFETIME_SECONDS', 1_800, 60, 86_400),
  DB_POOL_METRICS_INTERVAL_MS: boundedInteger('DB_POOL_METRICS_INTERVAL_MS', 60_000, 0, 3_600_000),
  AUTH_USER_CACHE_TTL_MS: boundedInteger('AUTH_USER_CACHE_TTL_MS', 5_000, 0, 60_000),
  AUTH_USER_CACHE_MAX_ENTRIES: boundedInteger('AUTH_USER_CACHE_MAX_ENTRIES', 2_000, 1, 100_000),
  JWT_SECRET: process.env['JWT_SECRET'] || 'herbalai_access_secret_change_in_prod',
  JWT_REFRESH_SECRET: process.env['JWT_REFRESH_SECRET'] || 'herbalai_refresh_secret_change_in_prod',
  FRONTEND_URL: process.env['FRONTEND_URL'] || 'http://localhost:3000',
  BACKEND_URL: process.env['BACKEND_URL'] || 'http://localhost:5000',
  GEMINI_API_KEY: process.env['GEMINI_API_KEY'],
  DR_AI_CHAT_MODELS: (process.env['DR_AI_CHAT_MODELS'] || 'gemini-3.6-flash,gemini-3.1-flash-lite,gemini-3.8-flash,gemini-3.7-flash')
    .split(',')
    .map((model) => model.trim())
    .filter((model, index, models) => Boolean(model) && models.indexOf(model) === index),
  DR_AI_MODEL_TIMEOUT_MS: boundedInteger('DR_AI_MODEL_TIMEOUT_MS', 15_000, 1_000, 30_000),
  DR_AI_EMBEDDING_TIMEOUT_MS: boundedInteger('DR_AI_EMBEDDING_TIMEOUT_MS', 10_000, 1_000, 30_000),
  DR_AI_REQUEST_TIMEOUT_MS: boundedInteger('DR_AI_REQUEST_TIMEOUT_MS', 90_000, 1_000, 110_000),
  DR_AI_MAX_MODEL_ATTEMPTS: boundedInteger('DR_AI_MAX_MODEL_ATTEMPTS', 4, 1, 6),
  DR_AI_MODEL_COOLDOWN_MS: boundedInteger('DR_AI_MODEL_COOLDOWN_MS', 60_000, 0, 300_000),
  GOOGLE_CLIENT_ID: process.env['GOOGLE_CLIENT_ID'] || '',
  GOOGLE_CLIENT_SECRET: process.env['GOOGLE_CLIENT_SECRET'] || '',
  GOOGLE_REDIRECT_URI: process.env['GOOGLE_REDIRECT_URI'] || `${process.env['BACKEND_URL'] || 'http://localhost:5000'}/api/auth/google/callback`,
  CLOUDINARY_CLOUD_NAME: process.env['CLOUDINARY_CLOUD_NAME'] || '',
  CLOUDINARY_API_KEY: process.env['CLOUDINARY_API_KEY'] || '',
  CLOUDINARY_API_SECRET: process.env['CLOUDINARY_API_SECRET'] || '',
  SMTP_HOST: process.env['SMTP_HOST'] || 'smtp.gmail.com',
  SMTP_PORT: parseInt(process.env['SMTP_PORT'] || '587', 10),
  SMTP_USER: process.env['SMTP_USER'] || '',
  SMTP_PASSWORD: process.env['SMTP_PASSWORD'] || '',
  SMTP_FROM: process.env['SMTP_FROM'] || '',
  EMAIL_PROVIDER: process.env['EMAIL_PROVIDER'] || (process.env['RESEND_API_KEY'] ? 'resend' : 'smtp'),
  RESEND_API_KEY: process.env['RESEND_API_KEY'] || '',
  RESEND_FROM_EMAIL: process.env['RESEND_FROM_EMAIL'] || '',
  GMAIL_CLIENT_ID: process.env['GMAIL_CLIENT_ID'] || '',
  GMAIL_CLIENT_SECRET: process.env['GMAIL_CLIENT_SECRET'] || '',
  GMAIL_REFRESH_TOKEN: process.env['GMAIL_REFRESH_TOKEN'] || '',
  GMAIL_SENDER_EMAIL: process.env['GMAIL_SENDER_EMAIL'] || '',
  REQUIRE_EMAIL_VERIFICATION: process.env['REQUIRE_EMAIL_VERIFICATION']?.trim().toLowerCase() !== 'false',
  EMAIL_DELIVERY_MODE: process.env['EMAIL_DELIVERY_MODE'] || (process.env['NODE_ENV'] === 'production' ? 'live' : 'log'),
  EMAIL_ALLOWED_RECIPIENTS: (process.env['EMAIL_ALLOWED_RECIPIENTS'] || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
};

if (ENV.NODE_ENV === 'production') {
  const jwtSecrets: Array<[name: string, value: string, fallback: string]> = [
    ['JWT_SECRET', ENV.JWT_SECRET, 'herbalai_access_secret_change_in_prod'],
    ['JWT_REFRESH_SECRET', ENV.JWT_REFRESH_SECRET, 'herbalai_refresh_secret_change_in_prod'],
  ];
  const invalidSecrets = jwtSecrets.filter(([, value, fallback]) => value === fallback || value.length < 32);

  if (invalidSecrets.length > 0) {
    throw new Error(`Production requires unique JWT secrets of at least 32 characters: ${invalidSecrets.map(([name]) => name).join(', ')}`);
  }
}
