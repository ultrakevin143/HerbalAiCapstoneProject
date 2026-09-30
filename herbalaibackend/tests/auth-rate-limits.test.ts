import { afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { closeDatabasePool } from '../src/lib/prisma.js';

app.set('trust proxy', 1);

afterAll(async () => { await closeDatabasePool(); });

describe('authentication request limits', () => {
  it('limits login attempts without consuming the signup bucket', async () => {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      expect((await request(app).post('/api/auth/login').set('X-Forwarded-For', '192.0.2.10').send({})).status).toBe(400);
    }

    const blocked = await request(app).post('/api/auth/login').set('X-Forwarded-For', '192.0.2.10').send({});
    expect(blocked.status).toBe(429);
    expect(blocked.body.message).toContain('15 minutes');
    expect(Number(blocked.headers['retry-after'])).toBeGreaterThan(0);
    expect((await request(app).post('/api/auth/signup').set('X-Forwarded-For', '192.0.2.10').send({})).status).toBe(400);
  });

  it('limits signup attempts after ten requests', async () => {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      expect((await request(app).post('/api/auth/signup').set('X-Forwarded-For', '192.0.2.20').send({})).status).toBe(400);
    }

    const blocked = await request(app).post('/api/auth/signup').set('X-Forwarded-For', '192.0.2.20').send({});
    expect(blocked.status).toBe(429);
    expect(blocked.body.message).toContain('Too many accounts');
    expect(Number(blocked.headers['retry-after'])).toBeGreaterThan(0);
  });

  it('shares the email-link limit between recovery and verification resend', async () => {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      expect((await request(app).post('/api/auth/forgot-password').set('X-Forwarded-For', '192.0.2.30').send({ email: 'invalid' })).status).toBe(400);
    }

    const recovery = await request(app).post('/api/auth/forgot-password').set('X-Forwarded-For', '192.0.2.30').send({ email: 'invalid' });
    const verification = await request(app).post('/api/auth/resend-email-verification').set('X-Forwarded-For', '192.0.2.30').send({ email: 'invalid' });
    expect(recovery.status).toBe(429);
    expect(verification.status).toBe(429);
    expect(recovery.body.message).toContain('15 minutes');
    expect(Number(recovery.headers['retry-after'])).toBeGreaterThan(0);
    expect((await request(app).get('/api/health')).status).toBe(200);
  });
});
