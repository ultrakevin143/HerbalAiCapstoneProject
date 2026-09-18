import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loginSchema } from '../src/schema/auth.schema.js';

const findMany = vi.hoisted(() => vi.fn());
vi.mock('../src/lib/prisma.js', () => ({ prisma: { user: { findMany } } }));
import { findUserByLoginIdentifier } from '../src/repositories/user.repository.js';

describe('Login identifier resolution', () => {
  beforeEach(() => findMany.mockReset());

  it.each(['Admin_User', 'person@example.com'])('accepts identifier %s', (identifier) => {
    expect(loginSchema.safeParse({ body: { identifier, password: 'password' } }).success).toBe(true);
  });

  it('preserves legacy email requests and rejects ambiguous or blank input', () => {
    expect(loginSchema.safeParse({ body: { email: 'person@example.com', password: 'password' } }).success).toBe(true);
    for (const body of [
      { identifier: '   ', password: 'password' },
      { identifier: 'user', email: 'person@example.com', password: 'password' },
      { identifier: 'user', password: '' },
    ]) expect(loginSchema.safeParse({ body }).success).toBe(false);
  });

  it.each([
    ['  Admin_User  ', 'username', 'Admin_User'],
    [' Person@Example.com ', 'email', 'Person@Example.com'],
  ])('resolves %s without case sensitivity', async (identifier, field, normalized) => {
    findMany.mockResolvedValue([{ id: 'account' }]);
    expect(await findUserByLoginIdentifier(identifier)).toEqual({ id: 'account' });
    expect(findMany).toHaveBeenCalledWith({ where: { [field]: { equals: normalized, mode: 'insensitive' } }, take: 2 });
  });

  it('fails closed for missing or case-colliding accounts', async () => {
    findMany.mockResolvedValue([]);
    expect(await findUserByLoginIdentifier('missing')).toBeNull();
    findMany.mockResolvedValue([{ id: 'first' }, { id: 'second' }]);
    expect(await findUserByLoginIdentifier('duplicate')).toBeNull();
  });
});
