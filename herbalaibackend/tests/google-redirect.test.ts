import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';
import { safeAuthCallback } from '../src/utils/auth-redirect.js';
import { safeAuthCallback as frontendCallback } from '../../herbalaifrontend/lib/auth-redirect';

vi.mock('../src/config/env.js', () => ({ ENV: { NODE_ENV: 'test', FRONTEND_URL: 'https://frontend.example' } }));
vi.mock('../src/repositories/user.repository.js', () => ({}));
vi.mock('../src/services/auth.service.js', () => ({ getGoogleAuthUrl: vi.fn(() => 'https://accounts.google.com/test'), googleLogin: vi.fn() }));

import { AuthController } from '../src/controllers/auth.controller.js';
import * as authService from '../src/services/auth.service.js';

function responseMock() {
  return {
    cookie: vi.fn(), clearCookie: vi.fn(), setHeader: vi.fn(), redirect: vi.fn(),
    status: vi.fn().mockReturnThis(), json: vi.fn(), type: vi.fn().mockReturnThis(), send: vi.fn(),
  };
}

describe.each([['backend', safeAuthCallback], ['frontend', frontendCallback]] as const)('%s redirect validation', (_name, validate) => {
  it.each(['/suggest', '/admin', '/community/16?reply=21#comments', '/library?search=lagundi%20uses'])('retains local destination %s', (destination) => {
    expect(validate(destination)).toBe(destination);
  });
  it.each([null, undefined, [' /suggest'], '', 'https://evil.example', '//evil.example', '/\\evil.example', '/%2fevil.example', '/%5cevil.example', '/%0a/evil.example', '/%7f', '/%', 'javascript:alert(1)', '/signin', '/auth/google/success', '/api/auth/google', '/test/../signin', '/%73ignin', '/' + 'a'.repeat(2048)])('rejects unsafe or looping destination %s', (destination) => {
    expect(validate(destination)).toBeNull();
  });
});

describe('Google destination handoff', () => {
  const controller = new AuthController();
  beforeEach(() => vi.clearAllMocks());

  it('stores a local destination separately without changing the random CSRF state', () => {
    const response = responseMock();
    controller.googleAuth({ query: { callbackUrl: '/suggest' } } as unknown as Request, response as unknown as Response);
    expect(response.cookie).toHaveBeenCalledWith('googleOAuthState', expect.stringMatching(/^[a-f0-9]{64}$/), expect.objectContaining({ httpOnly: true, sameSite: 'lax', maxAge: 600000 }));
    expect(response.cookie).toHaveBeenCalledWith('googleOAuthDestination', '/suggest', expect.objectContaining({ httpOnly: true, path: '/api/auth/google', maxAge: 600000 }));
  });

  it.each([undefined, '//evil.example'])('clears any stale destination for %s', (callbackUrl) => {
    const response = responseMock();
    controller.googleAuth({ query: { callbackUrl } } as unknown as Request, response as unknown as Response);
    expect(response.clearCookie).toHaveBeenCalledWith('googleOAuthDestination', expect.any(Object));
  });

  it('escapes the destination in the token POST form and consumes both cookies', async () => {
    vi.mocked(authService.googleLogin).mockResolvedValue({ refreshToken: 'test-only-token' } as Awaited<ReturnType<typeof authService.googleLogin>>);
    const state = 'a'.repeat(64);
    const response = responseMock();
    const next = vi.fn();
    await controller.googleCallback({ query: { code: 'test-code', state }, cookies: { googleOAuthState: state, googleOAuthDestination: '/library?search=lagundi&category=Other' } } as unknown as Request, response as unknown as Response, next);
    expect(next).not.toHaveBeenCalled();
    expect(response.send).toHaveBeenCalledWith(expect.stringContaining('name="callbackUrl" value="/library?search=lagundi&amp;category=Other"'));
    expect(response.clearCookie).toHaveBeenCalledWith('googleOAuthState', expect.any(Object));
    expect(response.clearCookie).toHaveBeenCalledWith('googleOAuthDestination', expect.any(Object));
  });

  it('does not complete sign-in with mismatched state even with a valid destination', async () => {
    const response = responseMock();
    await controller.googleCallback({ query: { code: 'test-code', state: 'a'.repeat(64) }, cookies: { googleOAuthState: 'b'.repeat(64), googleOAuthDestination: '/suggest' } } as unknown as Request, response as unknown as Response, vi.fn());
    expect(response.status).toHaveBeenCalledWith(400);
    expect(authService.googleLogin).not.toHaveBeenCalled();
    expect(response.send).not.toHaveBeenCalled();
  });
});
