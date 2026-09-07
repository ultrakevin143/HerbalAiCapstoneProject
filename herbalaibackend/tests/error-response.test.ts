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
});
