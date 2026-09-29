import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextFunction, Request, Response } from 'express';

const { googleLogin, getGoogleAuthUrl } = vi.hoisted(() => ({ googleLogin: vi.fn(), getGoogleAuthUrl: vi.fn() }));
vi.mock('../src/services/auth.service.js', () => ({ googleLogin, getGoogleAuthUrl }));

import { AuthController } from '../src/controllers/auth.controller.js';

describe('Google OAuth callback page', () => {
  beforeEach(() => {
    googleLogin.mockReset();
    getGoogleAuthUrl.mockReset();
  });

  it('sets a short-lived state cookie for the Google authorization request', () => {
    getGoogleAuthUrl.mockReturnValue('https://accounts.google.com/test');
    const response = { cookie: vi.fn(), clearCookie: vi.fn(), setHeader: vi.fn(), redirect: vi.fn() };

    new AuthController().googleAuth({} as Request, response as unknown as Response);

    const state = getGoogleAuthUrl.mock.calls[0]?.[0] as string;
    expect(state).toMatch(/^[a-f0-9]{64}$/);
    expect(response.cookie).toHaveBeenCalledWith('googleOAuthState', state, expect.objectContaining({
      httpOnly: true, sameSite: 'lax', path: '/api/auth/google', maxAge: 600000,
    }));
    expect(response.clearCookie).toHaveBeenCalledWith('googleOAuthDestination', expect.objectContaining({ path: '/api/auth/google' }));
    expect(response.redirect).toHaveBeenCalledWith('https://accounts.google.com/test');
  });

  it('rejects a missing or mismatched state before exchanging the code', async () => {
    const response = { clearCookie: vi.fn(), status: vi.fn().mockReturnThis(), json: vi.fn() };
    const expectedState = 'a'.repeat(64);

    await new AuthController().googleCallback(
      { query: { code: 'test-code', state: 'b'.repeat(64) }, cookies: { googleOAuthState: expectedState } } as unknown as Request,
      response as unknown as Response,
      vi.fn() as NextFunction,
    );

    expect(response.clearCookie).toHaveBeenCalledWith('googleOAuthState', expect.objectContaining({ path: '/api/auth/google' }));
    expect(response.status).toHaveBeenCalledWith(400);
    expect(googleLogin).not.toHaveBeenCalled();
  });

  it('automatically posts the token without showing the manual fallback during loading', async () => {
    googleLogin.mockResolvedValue({ refreshToken: 'test-refresh-token' });
    const state = 'a'.repeat(64);
    const response = {
      setHeader: vi.fn(),
      type: vi.fn(),
      send: vi.fn(),
      clearCookie: vi.fn(),
    };
    response.type.mockReturnValue(response);

    await new AuthController().googleCallback(
      { query: { code: 'test-code', state }, cookies: { googleOAuthState: state } } as unknown as Request,
      response as unknown as Response,
      vi.fn() as NextFunction,
    );

    const html = response.send.mock.calls[0]?.[0] as string;
    expect(googleLogin).toHaveBeenCalledWith('test-code');
    expect(response.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-store');
    expect(response.setHeader).toHaveBeenCalledWith('Content-Security-Policy', expect.stringContaining("style-src 'nonce-"));
    expect(html).toContain('Completing Google sign-in');
    expect(html).toContain('class="avatar" aria-hidden="true"');
    expect(html).toContain('M32 8C43 17 44 32 32 43C20 32 21 17 32 8Z');
    expect(html).not.toContain('class="spinner"');
    expect(html).toContain('visibility: hidden');
    expect(html).toContain('<noscript><style nonce="');
    expect(html).toContain('name="refreshToken" value="test-refresh-token"');
    expect(html).toContain('id="manual-continue" type="submit" hidden');
    expect(html).toContain('document.forms[0].submit()');
    expect(html).toContain('document.getElementById(\'manual-continue\').hidden = false');
    expect(html).toContain("document.querySelector('main').classList.add('is-visible')");
    expect(html).toContain('<noscript><button type="submit">Continue to Herbal Ai</button></noscript>');
  });
});
