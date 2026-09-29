import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { prisma } from '../src/lib/prisma.js';
import * as tokenRepo from '../src/repositories/token.repository.js';
import { refreshToken } from '../src/services/auth.service.js';
import { generateRefreshToken, verifyAccessToken } from '../src/utils/jwt.js';

describe('refresh-token rotation', () => {
  it('creates distinct tokens even within the same second', () => {
    const payload = { userId: 'test-user', role: 'contributor', sessionVersion: 0 };
    expect(generateRefreshToken(payload)).not.toBe(generateRefreshToken(payload));
  });

  it('preserves the old session if replacement fails and permits one concurrent rotation', async () => {
    const suffix = randomUUID();
    const user = await prisma.user.create({
      data: {
        username: `rotation_${suffix.replaceAll('-', '')}`,
        email: `rotation-${suffix}@example.invalid`,
        password: 'not-used-by-this-test',
        name: 'Rotation Test User',
      },
    });

    try {
      const oldToken = generateRefreshToken({ userId: user.id, role: user.role, sessionVersion: user.sessionVersion });
      const oldRecord = await tokenRepo.createToken({
        userId: user.id,
        type: 'REFRESH',
        token: oldToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      await expect(tokenRepo.rotateRefreshToken(oldRecord.id, {
        userId: user.id,
        token: oldToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      })).rejects.toThrow();
      expect(await tokenRepo.findActiveRefreshToken(oldToken)).not.toBeNull();

      const replacement = await refreshToken(oldToken);
      expect(replacement.refreshToken).not.toBe(oldToken);
      expect(verifyAccessToken(replacement.accessToken)?.userId).toBe(user.id);
      expect(await tokenRepo.findActiveRefreshToken(oldToken)).toBeNull();
      expect(await tokenRepo.findActiveRefreshToken(replacement.refreshToken)).not.toBeNull();
      await expect(refreshToken(oldToken)).rejects.toMatchObject({ status: 401 });

      const attempts = await Promise.allSettled([
        refreshToken(replacement.refreshToken),
        refreshToken(replacement.refreshToken),
      ]);
      expect(attempts.filter((attempt) => attempt.status === 'fulfilled')).toHaveLength(1);
      expect(attempts.filter((attempt) => attempt.status === 'rejected')).toHaveLength(1);
      expect(await tokenRepo.findActiveRefreshToken(replacement.refreshToken)).toBeNull();
      expect(await prisma.token.count({
        where: { userId: user.id, type: 'REFRESH', revokedAt: null },
      })).toBe(1);
    } finally {
      await prisma.user.delete({ where: { id: user.id } });
    }
  }, 30000);
});
