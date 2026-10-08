import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { environment, smtpSend, streamSend } = vi.hoisted(() => ({
  environment: {
    APP_NAME: 'Herbal-Ai',
    EMAIL_DELIVERY_MODE: 'live',
    EMAIL_ALLOWED_RECIPIENTS: [] as string[],
    EMAIL_PROVIDER: 'resend',
    RESEND_API_KEY: 'test-api-key',
    RESEND_FROM_EMAIL: 'verified@example.com',
    GMAIL_CLIENT_ID: 'gmail-client-id',
    GMAIL_CLIENT_SECRET: 'gmail-client-secret',
    GMAIL_REFRESH_TOKEN: 'gmail-refresh-token',
    GMAIL_SENDER_EMAIL: 'sender@gmail.com',
    SMTP_HOST: 'smtp.gmail.com',
    SMTP_PORT: 587,
    SMTP_USER: '',
    SMTP_PASSWORD: '',
    SMTP_FROM: '',
  },
  smtpSend: vi.fn(),
  streamSend: vi.fn(),
}));

vi.mock('../src/config/env.js', () => ({ ENV: environment }));
vi.mock('nodemailer', () => ({ default: { createTransport: (options: { streamTransport?: boolean }) => ({ sendMail: options.streamTransport ? streamSend : smtpSend }) } }));

import { ensureMailReady, sendMail } from '../src/lib/mailer.js';

const message = { to: 'recipient@example.com', subject: 'Verify your email', html: '<p>Verify</p>' };

beforeEach(() => {
  environment.EMAIL_DELIVERY_MODE = 'live';
  environment.EMAIL_PROVIDER = 'resend';
  environment.RESEND_API_KEY = 'test-api-key';
  environment.RESEND_FROM_EMAIL = 'verified@example.com';
  environment.GMAIL_CLIENT_ID = 'gmail-client-id';
  environment.GMAIL_CLIENT_SECRET = 'gmail-client-secret';
  environment.GMAIL_REFRESH_TOKEN = 'gmail-refresh-token';
  environment.GMAIL_SENDER_EMAIL = 'sender@gmail.com';
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('email delivery', () => {
  it('uses the HTTPS email API with a verified sender', async () => {
    const apiCall = vi.mocked(fetch);
    apiCall.mockResolvedValue(new Response(JSON.stringify({ id: 'sent-123' }), { status: 200 }));

    await expect(sendMail(message)).resolves.toEqual({ id: 'sent-123' });
    expect(apiCall).toHaveBeenCalledWith('https://api.resend.com/emails', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({ Authorization: 'Bearer test-api-key' }),
      body: JSON.stringify({
        from: '"Herbal-Ai" <verified@example.com>',
        to: ['recipient@example.com'],
        subject: message.subject,
        html: message.html,
      }),
    }));
    expect(smtpSend).not.toHaveBeenCalled();
  });

  it('fails before sending when the API is not configured', () => {
    environment.RESEND_API_KEY = '';
    expect(() => ensureMailReady(message.to)).toThrow('Email delivery is not configured.');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('reports provider rejection without exposing the response body', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('private provider details', { status: 403 }));
    await expect(sendMail(message)).rejects.toThrow('Email provider rejected the request (HTTP 403).');
  });

  it('sends a composed message through the Gmail HTTPS API', async () => {
    environment.EMAIL_PROVIDER = 'gmail';
    streamSend.mockResolvedValue({ message: Buffer.from('composed MIME message') });
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: 'access-token' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 'gmail-message-id' }), { status: 200 }));

    await expect(sendMail(message)).resolves.toEqual({ id: 'gmail-message-id' });
    expect(fetch).toHaveBeenNthCalledWith(1, 'https://oauth2.googleapis.com/token', expect.objectContaining({
      method: 'POST',
      body: expect.any(URLSearchParams),
    }));
    const tokenRequest = vi.mocked(fetch).mock.calls[0]?.[1];
    expect((tokenRequest?.body as URLSearchParams).get('grant_type')).toBe('refresh_token');
    expect(streamSend).toHaveBeenCalledWith(expect.objectContaining({
      from: '"Herbal-Ai" <sender@gmail.com>',
      to: message.to,
    }));
    expect(fetch).toHaveBeenNthCalledWith(2, 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({ Authorization: 'Bearer access-token' }),
      body: JSON.stringify({ raw: Buffer.from('composed MIME message').toString('base64url') }),
    }));
    expect(smtpSend).not.toHaveBeenCalled();
  });

  it('rejects incomplete Gmail configuration before account creation', () => {
    environment.EMAIL_PROVIDER = 'gmail';
    environment.GMAIL_REFRESH_TOKEN = '';
    expect(() => ensureMailReady(message.to)).toThrow('Email delivery is not configured.');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('does not expose Google token errors', async () => {
    environment.EMAIL_PROVIDER = 'gmail';
    vi.mocked(fetch).mockResolvedValue(new Response('private provider details', { status: 401 }));
    await expect(sendMail(message)).rejects.toThrow('Gmail authorization failed (HTTP 401).');
    expect(streamSend).not.toHaveBeenCalled();
  });

  it.each(['invalid_grant', 'invalid_client', 'unauthorized_client'])('reports only the safe Google authorization code %s', async reason => {
    environment.EMAIL_PROVIDER = 'gmail';
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({
      error: reason, error_description: 'PRIVATE refresh-token client-secret sender-address',
      refresh_token: 'PRIVATE token',
    }), { status: 400 }));
    await expect(sendMail(message)).rejects.toThrow(`Gmail authorization failed (HTTP 400; ${reason}).`);
    expect(fetch).toHaveBeenCalledOnce();
    expect(streamSend).not.toHaveBeenCalled();
  });

  it.each([null, [], { error: 'PRIVATE provider response' }, { error: { secret: 'PRIVATE' } }])('keeps unknown token rejection payloads private (%s)', async payload => {
    environment.EMAIL_PROVIDER = 'gmail';
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify(payload), { status: 400 }));
    await expect(sendMail(message)).rejects.toThrow('Gmail authorization failed (HTTP 400).');
    expect(fetch).toHaveBeenCalledOnce();
    expect(streamSend).not.toHaveBeenCalled();
  });

  it.each([null, [], {}, { access_token: 123 }, { access_token: '' }, { access_token: '  ' }])('rejects malformed successful token payloads before sending (%s)', async payload => {
    environment.EMAIL_PROVIDER = 'gmail';
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify(payload), { status: 200 }));
    await expect(sendMail(message)).rejects.toThrow('Gmail authorization returned no access token.');
    expect(fetch).toHaveBeenCalledOnce();
    expect(streamSend).not.toHaveBeenCalled();
  });

  it('rejects a non-JSON token success without exposing its content', async () => {
    environment.EMAIL_PROVIDER = 'gmail';
    vi.mocked(fetch).mockResolvedValue(new Response('PRIVATE non-JSON response', { status: 200 }));
    await expect(sendMail(message)).rejects.toThrow('Gmail authorization returned no access token.');
    expect(fetch).toHaveBeenCalledOnce();
    expect(streamSend).not.toHaveBeenCalled();
  });

  it('does not claim delivery when Gmail rejects a message', async () => {
    environment.EMAIL_PROVIDER = 'gmail';
    streamSend.mockResolvedValue({ message: Buffer.from('composed MIME message') });
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: 'access-token' }), { status: 200 }))
      .mockResolvedValueOnce(new Response('private provider details', { status: 403 }));

    await expect(sendMail(message)).rejects.toThrow('Gmail rejected the message (HTTP 403).');
  });

  it('keeps local log mode free of external delivery', async () => {
    environment.EMAIL_DELIVERY_MODE = 'log';
    await expect(sendMail(message)).resolves.toMatchObject({ suppressed: true });
    expect(fetch).not.toHaveBeenCalled();
  });
});
