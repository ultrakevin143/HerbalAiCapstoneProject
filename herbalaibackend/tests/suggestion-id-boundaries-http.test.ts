import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  find: vi.fn(), edit: vi.fn(), resubmit: vi.fn(), approve: vi.fn(),
  requestChanges: vi.fn(), reject: vi.fn(), herb: vi.fn(), pending: vi.fn(),
  embed: vi.fn(), upload: vi.fn(), notify: vi.fn(), mail: vi.fn(),
}));
vi.mock('../src/repositories/suggest.repository.js', () => ({
  findSuggestionById: mocks.find, editSuggestion: mocks.edit,
  resubmitSuggestion: mocks.resubmit, approveSuggestion: mocks.approve,
  requestChanges: mocks.requestChanges, rejectSuggestion: mocks.reject,
}));
vi.mock('../src/lib/prisma.js', () => ({ prisma: {
  herb: { findFirst: mocks.herb }, suggestedHerb: { findFirst: mocks.pending },
} }));
vi.mock('../src/repositories/herb.repository.js', () => ({ invalidateHerbCache: vi.fn() }));
vi.mock('../src/services/ai/core/gemini-service.js', () => ({ generateEmbedding: mocks.embed }));
vi.mock('../src/services/cloudinary.service.js', () => ({ uploadToCloudinary: mocks.upload }));
vi.mock('../src/repositories/notification.repository.js', () => ({ createNotification: mocks.notify }));
vi.mock('../src/lib/mailer.js', () => ({ sendMail: mocks.mail }));

import { SuggestController } from '../src/controllers/suggest.controller.js';
import {
  approveSuggestionSchema, editSuggestionSchema, rejectSuggestionSchema,
  requestSuggestionChangesSchema, suggestHerbSchema,
} from '../src/schema/suggest.schema.js';
import { validateSchema } from '../src/middlewares/validate.js';
import { errorResponse } from '../src/utils/error-response.js';

const app = express();
const controller = new SuggestController();
app.use(express.json());
app.use((req, _res, next) => {
  Object.assign(req, { user: { userId: 'qa-reviewer', role: 'admin' } });
  next();
});
app.patch('/:id', validateSchema(editSuggestionSchema), controller.edit);
app.post('/:id/resubmit', validateSchema(suggestHerbSchema), controller.resubmit);
app.post('/:id/approve', validateSchema(approveSuggestionSchema), controller.approveSuggestion);
app.post('/:id/request-changes', validateSchema(requestSuggestionChangesSchema), controller.requestChanges);
app.post('/:id/reject', validateSchema(rejectSuggestionSchema), controller.rejectSuggestion);
app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  const response = errorResponse(error, true);
  res.status(response.status).json(response.body);
});

const body = {
  localName: 'QA only', scientificName: 'QA only species', category: 'Other',
  medicinalUses: 'None', preparationMethod: 'None', dosage: 'None',
  informationSource: 'QA citation', imageUrl: '',
  references: [{ title: 'QA source', citation: 'QA only', supports: ['identity'] }],
  revision: 0, reviewNotes: 'QA boundary check only.', evidenceClass: 'DOCUMENTED_TRADITIONAL_USE',
};
const editBody = Object.fromEntries(Object.entries(body).filter(([key]) => key !== 'evidenceClass'));
const actions = ['edit', 'resubmit', 'approve', 'request-changes', 'reject'] as const;
const perform = (id: string, action: typeof actions[number]) => action === 'edit'
  ? request(app).patch(`/${encodeURIComponent(id)}`).send(editBody)
  : request(app).post(`/${encodeURIComponent(id)}/${action}`).send(body);

describe('Suggestion mutation ID boundaries', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.find.mockResolvedValue(null);
    mocks.edit.mockResolvedValue(null);
    mocks.herb.mockResolvedValue(null);
  });

  for (const action of actions) {
    it.each(['7junk', '7.5', '7e0', '0x7', '+7', ' 7 ', '007', '0', '-7', '2147483648', '9007199254740992'])
      ('rejects %s before persistence or provider calls for ' + action, async (id) => {
        const response = await perform(id, action);
        expect(response.status).toBe(400);
        expect(response.body.message).toContain('Invalid');
        for (const dependency of Object.values(mocks)) expect(dependency).not.toHaveBeenCalled();
      });

    it.each(['7', '2147483647'])('accepts the valid integer ID %s for ' + action, async (id) => {
      const response = await perform(id, action);
      expect(response.status).toBe(action === 'edit' ? 409 : 404);
      if (action === 'edit') {
        expect(mocks.edit).toHaveBeenCalledWith(Number(id), 'qa-reviewer', expect.any(Object));
      } else {
        expect(mocks.find).toHaveBeenCalledWith(Number(id));
      }
      expect(mocks.embed).not.toHaveBeenCalled();
      expect(mocks.upload).not.toHaveBeenCalled();
      expect(mocks.notify).not.toHaveBeenCalled();
      expect(mocks.mail).not.toHaveBeenCalled();
    });
  }
});
