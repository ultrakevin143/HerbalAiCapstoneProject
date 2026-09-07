import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import app from '../src/app.js';
import { prisma, closeDatabasePool } from '../src/lib/prisma.js';
import { generateAccessToken } from '../src/utils/jwt.js';

const id = `profile-${randomUUID()}`;
const email = `${randomUUID()}@profile.invalid`;
const username = `profile_${randomUUID().replaceAll('-', '')}`;
const token = generateAccessToken({ userId: id, role: 'contributor' });

describe('Self-service profile editing', () => {
  beforeAll(async () => {
    await prisma.user.create({
      data: {
        id,
        email,
        username,
        password: 'not-used-by-this-test',
        name: 'Profile Test User',
        role: 'contributor',
        emailVerified: new Date(),
      },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id } });
    await closeDatabasePool();
  });

  it('rejects an unauthenticated profile update', async () => {
    const response = await request(app).patch('/api/auth/me').send({ name: 'Unauthorized Change' });
    expect(response.status).toBe(401);
  });

  it('updates only allowed personal fields and makes them immediately visible to the session', async () => {
    const response = await request(app)
      .patch('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '  Updated Profile Name  ', avatar: '🌿', bio: '  Local herb advocate.  ' });

    expect(response.status).toBe(200);
    expect(response.body.data.user).toMatchObject({
      id,
      email,
      username,
      name: 'Updated Profile Name',
      avatar: '🌿',
      bio: 'Local herb advocate.',
      role: 'contributor',
      isBanned: false,
    });

    const session = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(session.status).toBe(200);
    expect(session.body.data.user).toMatchObject({ name: 'Updated Profile Name', bio: 'Local herb advocate.' });
  });

  it('rejects attempts to change protected account fields', async () => {
    const response = await request(app)
      .patch('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Allowed Name', role: 'admin', email: 'attacker@example.test', isBanned: true });

    expect(response.status).toBe(400);
    const stored = await prisma.user.findUniqueOrThrow({ where: { id } });
    expect(stored).toMatchObject({ email, username, name: 'Updated Profile Name', role: 'contributor', isBanned: false });
  });

  it('rejects invalid and empty profile updates', async () => {
    const invalidName = await request(app)
      .patch('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'x' });
    const empty = await request(app)
      .patch('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(invalidName.status).toBe(400);
    expect(empty.status).toBe(400);
  });
});
