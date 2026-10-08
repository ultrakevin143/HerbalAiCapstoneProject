import type { Request, Response, NextFunction } from 'express';
import { CreditError, getCreditsConfig } from '../config/credits.js';
import { testPaidEventSchema, verifyTestWebhook } from '../services/paymongo-test.service.js';
import { fulfillTestPurchase } from '../repositories/credits.repository.js';

export const testCreditsWebhook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const config = getCreditsConfig();
    if (config.mode !== 'test') throw new CreditError(404, 'Test payments are disabled.');
    if (!Buffer.isBuffer(req.body)) throw new CreditError(400, 'A raw signed test payment body is required.');
    verifyTestWebhook(req.body, req.get('Paymongo-Signature'), config.webhookSecret);
    let parsed: unknown;
    try { parsed = JSON.parse(req.body.toString('utf8')); } catch { throw new CreditError(400, 'Invalid test payment JSON.'); }
    const event = testPaidEventSchema.safeParse(parsed);
    if (!event.success) throw new CreditError(400, 'Only a confirmed test checkout event is accepted.');
    const result = await fulfillTestPurchase(event.data.data.attributes.data.id);
    res.json({ status: 'success', data: result });
  } catch (error) { next(error); }
};
