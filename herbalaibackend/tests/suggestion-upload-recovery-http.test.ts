import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  uploadStream: vi.fn(), destroy: vi.fn(), create: vi.fn(), resubmit: vi.fn(),
  find: vi.fn(), herb: vi.fn(), pending: vi.fn(), notify: vi.fn(),
}));
vi.mock('cloudinary', () => ({ v2: { config: vi.fn(), uploader: { upload_stream: mocks.uploadStream } } }));
vi.mock('../src/config/env.js', () => ({ ENV: {
  CLOUDINARY_CLOUD_NAME: 'qa', CLOUDINARY_API_KEY: 'qa', CLOUDINARY_API_SECRET: 'qa',
} }));
vi.mock('../src/lib/prisma.js', () => ({ prisma: {
  herb: { findFirst: mocks.herb }, suggestedHerb: { findFirst: mocks.pending },
} }));
vi.mock('../src/repositories/suggest.repository.js', () => ({
  createSuggestion: mocks.create, findSuggestionById: mocks.find, resubmitSuggestion: mocks.resubmit,
}));
vi.mock('../src/repositories/herb.repository.js', () => ({ invalidateHerbCache: vi.fn() }));
vi.mock('../src/repositories/notification.repository.js', () => ({ createNotification: mocks.notify }));
vi.mock('../src/services/ai/core/gemini-service.js', () => ({ generateEmbedding: vi.fn() }));
vi.mock('../src/lib/mailer.js', () => ({ sendMail: vi.fn() }));

import { SuggestController } from '../src/controllers/suggest.controller.js';
import { uploadImage } from '../src/middlewares/upload.middleware.js';
import { validateSchema } from '../src/middlewares/validate.js';
import { suggestHerbSchema } from '../src/schema/suggest.schema.js';
import { errorResponse } from '../src/utils/error-response.js';

const app = express();
const controller = new SuggestController();
app.use((req, _res, next) => {
  Object.assign(req, { user: { userId: 'qa-owner', role: 'contributor' } });
  next();
});
app.post('/api/suggest', uploadImage, validateSchema(suggestHerbSchema), controller.suggest);
app.post('/api/suggest/:id/resubmit', uploadImage, validateSchema(suggestHerbSchema), controller.resubmit);
app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  const response = errorResponse(error, true);
  res.status(response.status).json(response.body);
});

const fields = {
  localName: 'TEST ONLY', scientificName: 'QA only species', category: 'Other',
  medicinalUses: 'None', preparationMethod: 'None', dosage: 'None', informationSource: 'QA citation',
};
const perform = (path: string) => {
  let submission = request(app).post(path);
  for (const [field, value] of Object.entries(fields)) submission = submission.field(field, value);
  return submission.attach('image', Buffer.from('TEST ONLY fixture'), { filename: 'qa.png', contentType: 'image/png' });
};

describe('Suggestion image recovery through multipart HTTP handlers', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.herb.mockResolvedValue(null);
    mocks.pending.mockResolvedValue(null);
    mocks.find.mockResolvedValue({
      ...fields, id: 7, status: 'ChangesRequested', submitterId: 'qa-owner', imageUrl: 'https://example.invalid/original.png',
    });
    mocks.uploadStream.mockReturnValue({ end: vi.fn(), on: vi.fn(), destroy: mocks.destroy });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it.each(['/api/suggest', '/api/suggest/7/resubmit'])
    ('returns safe 503 without a partial record when upload stalls on %s', async path => {
      vi.useFakeTimers();
      const responsePending = perform(path).then(response => response);
      await vi.waitFor(() => expect(mocks.uploadStream).toHaveBeenCalledOnce());
      await vi.advanceTimersByTimeAsync(20_000);
      const response = await responsePending;
      expect(response.status).toBe(503);
      expect(response.body).toEqual({
        status: 'error', code: 'MEDIA_UPLOAD_UNAVAILABLE',
        message: 'Image upload is temporarily unavailable. Please try again later.',
      });
      expect(mocks.destroy).toHaveBeenCalledOnce();
      expect(mocks.create).not.toHaveBeenCalled();
      expect(mocks.resubmit).not.toHaveBeenCalled();
      expect(mocks.notify).not.toHaveBeenCalled();
    });

  it('persists one pending suggestion after a successful upload', async () => {
    const imageUrl = 'https://example.invalid/qa.png';
    mocks.uploadStream.mockImplementation((_options, callback) => ({
      on: vi.fn(), destroy: mocks.destroy,
      end: vi.fn(() => callback(null, { secure_url: imageUrl })),
    }));
    mocks.create.mockResolvedValue({ id: 7, status: 'Pending', imageUrl });
    const response = await perform('/api/suggest');
    expect(response.status).toBe(201);
    expect(mocks.create).toHaveBeenCalledExactlyOnceWith({ ...fields, submitterId: 'qa-owner', imageUrl });
    expect(mocks.destroy).not.toHaveBeenCalled();
  });

  it('returns the existing record to pending after a successful replacement upload', async () => {
    const imageUrl = 'https://example.invalid/replacement.png';
    mocks.uploadStream.mockImplementation((_options, callback) => ({
      on: vi.fn(), destroy: mocks.destroy,
      end: vi.fn(() => callback(null, { secure_url: imageUrl })),
    }));
    mocks.resubmit.mockResolvedValue({ id: 7, status: 'Pending', imageUrl });
    const response = await perform('/api/suggest/7/resubmit');
    expect(response.status).toBe(200);
    expect(mocks.resubmit).toHaveBeenCalledExactlyOnceWith(7, 'qa-owner', expect.objectContaining({ ...fields, imageUrl }));
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.destroy).not.toHaveBeenCalled();
  });
});
