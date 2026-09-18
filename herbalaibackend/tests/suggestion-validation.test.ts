import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { generateAccessToken } from '../src/utils/jwt.js';
import { approveSuggestionSchema, requestSuggestionChangesSchema, suggestHerbSchema } from '../src/schema/suggest.schema.js';

const token = generateAccessToken({ userId: 'validation-only-no-database-user', role: 'contributor' });
const body = { localName: 'Test', scientificName: 'Test scientific', category: 'Other', medicinalUses: 'Test only', preparationMethod: 'Do not use', dosage: 'None', informationSource: 'Test reference' };
describe('Suggestion validation before persistence/upload', () => {
  for (const field of Object.keys(body)) {
    it(`rejects whitespace-only ${field}`, () => {
      expect(suggestHerbSchema.safeParse({ body: { ...body, [field]: '   ' } }).success).toBe(false);
    });
  }
  it('accepts populated required fields', () => {
    expect(suggestHerbSchema.safeParse({ body }).success).toBe(true);
  });
  it('returns a client error for disallowed upload format', async () => {
    const res = await request(app).post('/api/suggest').set('Authorization', `Bearer ${token}`)
      .attach('image', Buffer.from('test'), { filename: 'test.txt', contentType: 'text/plain' });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('format');
  });
  it('returns 413 for uploads exceeding 5 MiB', async () => {
    const res = await request(app).post('/api/suggest').set('Authorization', `Bearer ${token}`)
      .attach('image', Buffer.alloc(5 * 1024 * 1024 + 1), { filename: 'large.png', contentType: 'image/png' });
    expect(res.status).toBe(413);
  });
  it('requires fields even when an image is absent', async () => {
    const res = await request(app).post('/api/suggest').set('Authorization', `Bearer ${token}`).send({});
    expect(res.status).toBe(400);
  });

  it('requires an explicit publishable evidence class for approval', () => {
    expect(approveSuggestionSchema.safeParse({ body: {} }).success).toBe(false);
    expect(approveSuggestionSchema.safeParse({ body: { evidenceClass: 'UNASSESSED' } }).success).toBe(false);
    expect(approveSuggestionSchema.safeParse({ body: { evidenceClass: 'DOCUMENTED_TRADITIONAL_USE', revision: 0 } }).success).toBe(true);
  });

  it('requires meaningful reviewer notes when requesting changes', () => {
    expect(requestSuggestionChangesSchema.safeParse({ body: { reviewNotes: 'Too short' } }).success).toBe(false);
    expect(requestSuggestionChangesSchema.safeParse({ body: { reviewNotes: 'Please provide a primary research source.', revision: 0 } }).success).toBe(true);
  });
});
