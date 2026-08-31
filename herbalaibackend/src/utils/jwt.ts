import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';

export interface JwtPayload {
  userId: string;
  role: string;
}

/**
 * Signs a short-lived access token (15 minutes).
 */
export const generateAccessToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, ENV.JWT_SECRET, { expiresIn: '15m' });
};

/**
 * Signs a long-lived refresh token (7 days).
 */
export const generateRefreshToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, ENV.JWT_REFRESH_SECRET, { expiresIn: '7d' });
};

/**
 * Verifies an access token. Returns the payload or null if invalid.
 */
export const verifyAccessToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, ENV.JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
};

/**
 * Verifies a refresh token. Returns the payload or null if invalid.
 */
export const verifyRefreshToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, ENV.JWT_REFRESH_SECRET) as JwtPayload;
  } catch {
    return null;
  }
};
