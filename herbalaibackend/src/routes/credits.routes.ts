import { Router } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { AuthMiddleware } from '../middlewares/auth.middleware.js';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware.js';
import { CreditError, getCreditsConfig } from '../config/credits.js';
import { createCreditPurchase, getCompletedCreditResponse, getCreditWallet } from '../repositories/credits.repository.js';

const router = Router();
router.use(new AuthMiddleware().execute);
router.use((_req, res, next) => { res.setHeader('Cache-Control', 'private, no-store'); next(); });
router.use(rateLimit({ windowMs: 60000, max: 30, standardHeaders: true, legacyHeaders: false }));
router.get('/', async (req, res, next) => {
  try {
    const config = getCreditsConfig();
    if (config.mode === 'off') { res.json({ status: 'success', data: { enabled: false, testMode: true, packages: [] } }); return; }
    const wallet = await getCreditWallet((req as AuthenticatedRequest).user!.userId);
    res.setHeader('Cache-Control', 'private, no-store');
    res.json({ status: 'success', data: { ...wallet, enabled: true, testMode: true, checkoutAvailable: Boolean(config.secretKey && config.webhookSecret), packages: config.packages } });
  } catch (error) { next(error); }
});
router.post('/checkout', async (req, res, next) => {
  try {
    const body = z.strictObject({ packageId: z.string().min(1).max(40), requestId: z.uuid() }).safeParse(req.body);
    if (!body.success) throw new CreditError(400, 'A valid test package and purchase request identifier are required.');
    const result = await createCreditPurchase((req as AuthenticatedRequest).user!.userId, body.data.packageId, body.data.requestId);
    res.status(201).json({ status: 'success', data: result });
  } catch (error) { next(error); }
});
router.get('/answers/:requestId', async (req, res, next) => {
  try {
    if (getCreditsConfig().mode !== 'test' || !z.uuid().safeParse(req.params['requestId']).success) throw new CreditError(404, 'Test answer not available.');
    const answer = await getCompletedCreditResponse((req as AuthenticatedRequest).user!.userId, String(req.params['requestId']));
    res.setHeader('Cache-Control', 'private, no-store');
    res.json({ status: 'success', data: answer });
  } catch (error) { next(error); }
});
export default router;
