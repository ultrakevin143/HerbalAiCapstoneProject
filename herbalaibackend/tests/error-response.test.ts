import { describe, expect, it } from 'vitest';
import { errorResponse } from '../src/utils/error-response.js';

describe('production error responses', () => {
  it.each([400, 401, 403, 409])('preserves an intentional %i message without a stack', status => {
    const result = errorResponse(Object.assign(new Error('Safe validation message'), { status }), true);
    expect(result).toEqual({ status, body: { status: 'error', message: 'Safe validation message' } });
  });
  it.each([undefined, 500, 503, 200, 999, 401.5])('hides internal details for status %s', status => {
    const result = errorResponse(Object.assign(new Error('Secret database details'), { status }), true);
    expect(result.body).toEqual({ status: 'error', message: 'Internal Server Error' });
    expect(result.status).toBe(status === 503 ? 503 : 500);
  });
  it('retains development diagnostics', () => {
    const error = new Error('Development detail');
    expect(errorResponse(error, false).body).toMatchObject({ message: error.message, stack: error.stack });
  });
  it.each([true, false])('redacts database failures in production=%s', (production) => {
    for (const code of ['P2028', 'P2024', 'P1001', 'ECONNRESET']) {
      const error = Object.assign(new Error('Transaction API error: secret postgres://user:password@host'), { code });
      const result = errorResponse(error, production);
      expect(result.status).toBe(503);
      expect(result.body).toEqual({ status: 'error', code: 'DATABASE_UNAVAILABLE', message: 'The database is temporarily unavailable. Refresh to check the latest status before trying again.' });
    }
  });
  it('does not claim an unknown-commit failure saved nothing', () => {
    const result = errorResponse(Object.assign(new Error('Transaction commit failed'), { code: 'P2028' }), false);
    expect(result.body.message).not.toMatch(/nothing|not saved|retry now/i);
    expect(result.body).not.toHaveProperty('stack');
  });
  it('redacts other Prisma failures without labeling them temporary', () => {
    const result = errorResponse(Object.assign(new Error('Secret query'), { code: 'P2002' }), false);
    expect(result.status).toBe(500);
    expect(result.body.message).not.toContain('Secret');
  });
});
