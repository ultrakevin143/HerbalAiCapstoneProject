import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextFunction, Request, Response } from 'express';

const googleLogin = vi.hoisted(() => vi.fn());
vi.mock('../src/services/auth.service.js', () => ({ googleLogin }));

import { AuthController } from '../src/controllers/auth.controller.js';

describe('Google OAuth callback page', () => {
  beforeEach(() => googleLogin.mockReset());

  it('automatically posts the token without showing the manual fallback during loading', async () => {
    googleLogin.mockResolvedValue({ refreshToken: 'test-refresh-token' });
    const response = {
      setHeader: vi.fn(),
      type: vi.fn(),
      send: vi.fn(),
    };
    response.type.mockReturnValue(response);

    await new AuthController().googleCallback(
      { query: { code: 'test-code' } } as unknown as Request,
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
