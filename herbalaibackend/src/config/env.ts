import dotenv from 'dotenv';
import process from 'node:process';
dotenv.config();

export const ENV = {
  APP_NAME: process.env['APP_NAME'] || 'Herbal AI',
  PORT: parseInt(process.env['PORT'] || '5000', 10),
  NODE_ENV: process.env['NODE_ENV'] || 'development',
  DATABASE_URL: process.env['DATABASE_URL'],
  JWT_SECRET: process.env['JWT_SECRET'] || 'herbalai_access_secret_change_in_prod',
  JWT_REFRESH_SECRET: process.env['JWT_REFRESH_SECRET'] || 'herbalai_refresh_secret_change_in_prod',
  FRONTEND_URL: process.env['FRONTEND_URL'] || 'http://localhost:3000',
  BACKEND_URL: process.env['BACKEND_URL'] || 'http://localhost:5000',
  GEMINI_API_KEY: process.env['GEMINI_API_KEY'],
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
};

if (ENV.NODE_ENV === 'production') {
  if (ENV.JWT_SECRET === 'herbalai_access_secret_change_in_prod') {
    console.warn('⚠️ WARNING: Using default JWT_SECRET in production is insecure. Please set JWT_SECRET in .env');
  }
  if (ENV.JWT_REFRESH_SECRET === 'herbalai_refresh_secret_change_in_prod') {
    console.warn('⚠️ WARNING: Using default JWT_REFRESH_SECRET in production is insecure. Please set JWT_REFRESH_SECRET in .env');
  }
}

