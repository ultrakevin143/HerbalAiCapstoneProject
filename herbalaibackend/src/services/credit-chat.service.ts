import type { Request } from 'express';
import { z } from 'zod';
import { CreditError, getCreditsConfig } from '../config/credits.js';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware.js';
import { reserveCreditRequest } from '../repositories/credits.repository.js';
import type { ChatTurn } from './chat.service.js';

export const beginChatCredit = (req: Request, message: string, history: ChatTurn[]) => {
  if (getCreditsConfig().mode === 'off') return Promise.resolve(null);
  const userId = (req as AuthenticatedRequest).user?.userId;
  if (!userId) throw new CreditError(401, 'Sign in before using Dr. Ai credits.');
  const requestKey = req.get('X-Idempotency-Key');
  if (!z.uuid().safeParse(requestKey).success) throw new CreditError(400, 'A valid question request identifier is required.');
  const normalizedHistory = history.map(turn => ({ role: turn.role, parts: turn.parts.map(part => ({ text: part.text })) }));
  return reserveCreditRequest(userId, requestKey!, { message, history: normalizedHistory });
};
