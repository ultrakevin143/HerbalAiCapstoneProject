import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { prisma, closeDatabasePool } from '../src/lib/prisma.js';
import { generateAccessToken } from '../src/utils/jwt.js';
import { updateUserBanStatus } from '../src/repositories/user.repository.js';
import { upsertKB, updateKB, deleteKB } from '../src/repositories/knowledgebase.repository.js';

const suffix = randomUUID();
const adminId = `audit-admin-${suffix}`;
const targetId = `audit-target-${suffix}`;
const missingAdminId = `audit-missing-${suffix}`;
const question = `Audit transaction test ${suffix}?`;
const adminToken = generateAccessToken({ userId: adminId, role: 'admin' });

describe('audited administrator mutations', () => {
  beforeAll(async () => {
    await prisma.user.createMany({
      data: [
        { id: adminId, username: `audit_admin_${suffix.replaceAll('-', '')}`, email: `audit-admin-${suffix}@example.invalid`, password: 'unused', name: 'Audit Admin', role: 'admin' },
        { id: targetId, username: `audit_target_${suffix.replaceAll('-', '')}`, email: `audit-target-${suffix}@example.invalid`, password: 'unused', name: 'Audit Target' },
      ],
    });
  });

  afterAll(async () => {
    await prisma.auditLog.deleteMany({ where: { adminId } });
    await prisma.knowledgeBase.deleteMany({ where: { question } });
    await prisma.user.deleteMany({ where: { id: { in: [adminId, targetId] } } });
    await closeDatabasePool();
  });

  it('commits ban and unban with their audit entries', async () => {
    await updateUserBanStatus(targetId, true, adminId, { type: 'indefinite', reason: 'TEST audited moderation' });
    expect(await prisma.user.findUniqueOrThrow({ where: { id: targetId } })).toMatchObject({ isBanned: true });
    expect(await prisma.auditLog.count({ where: { adminId, targetId, action: 'BAN_USER' } })).toBe(1);

    await updateUserBanStatus(targetId, false, adminId);
    expect(await prisma.user.findUniqueOrThrow({ where: { id: targetId } })).toMatchObject({ isBanned: false });
    expect(await prisma.auditLog.count({ where: { adminId, targetId, action: 'UNBAN_USER' } })).toBe(1);
  });

  it('rolls back a ban if the audit entry cannot be written', async () => {
    await expect(updateUserBanStatus(targetId, true, missingAdminId, { type: 'indefinite', reason: 'TEST audit rollback' })).rejects.toThrow();
    expect(await prisma.user.findUniqueOrThrow({ where: { id: targetId } })).toMatchObject({ isBanned: false });
    expect(await prisma.auditLog.count({ where: { targetId, action: 'BAN_USER' } })).toBe(1);
  });

  it('commits knowledge-base changes with audit entries and rolls back an unaudited import', async () => {
    await expect(upsertKB({ question, answer: 'Original answer' }, missingAdminId)).rejects.toThrow();
    expect(await prisma.knowledgeBase.findUnique({ where: { question } })).toBeNull();

    const created = await upsertKB({ question, answer: 'Original answer' }, adminId);
    expect(created.created).toBe(true);
    await updateKB(created.id, { answer: 'Updated answer' }, adminId);
    expect(await prisma.knowledgeBase.findUniqueOrThrow({ where: { id: created.id } })).toMatchObject({ answer: 'Updated answer' });
    await deleteKB(created.id, adminId);
    expect(await prisma.knowledgeBase.findUnique({ where: { id: created.id } })).toBeNull();
    expect(await prisma.auditLog.findMany({ where: { adminId, targetId: created.id }, orderBy: { id: 'asc' }, select: { action: true } })).toEqual([
      { action: 'IMPORT_KNOWLEDGE_BASE' },
      { action: 'UPDATE_KNOWLEDGE_BASE' },
      { action: 'DELETE_KNOWLEDGE_BASE' },
    ]);
  });

  it('records herb edits and deletion with the administrator response', async () => {
    const herbId = `audit-herb-${suffix}`;
    await prisma.herb.create({
      data: {
        id: herbId,
        localName: `Audit herb ${suffix}`,
        scientificName: `Testus audit-${suffix}`,
        category: 'Test only',
        medicinalUses: 'Test only',
        preparationMethod: 'Test only',
        dosage: 'Test only',
      },
    });

    try {
      const updated = await request(app)
        .put(`/api/herbs/${herbId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ medicinalUses: 'Updated test use' });
      expect(updated.status).toBe(200);
      expect(await prisma.auditLog.count({ where: { adminId, targetId: herbId, action: 'UPDATE_HERB' } })).toBe(1);

      const deleted = await request(app)
        .delete(`/api/herbs/${herbId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(deleted.status).toBe(200);
      expect(await prisma.herb.findUnique({ where: { id: herbId } })).toBeNull();
      expect(await prisma.auditLog.count({ where: { adminId, targetId: herbId, action: 'DELETE_HERB' } })).toBe(1);
    } finally {
      await prisma.herb.deleteMany({ where: { id: herbId } });
    }
  });

  it('checks the current database role on administrator routes', async () => {
    const allowed = await request(app).get('/api/auth/users').set('Authorization', `Bearer ${adminToken}`);
    expect(allowed.status).toBe(200);

    await prisma.user.update({ where: { id: adminId }, data: { role: 'contributor' } });
    try {
      const forbidden = await request(app).get('/api/auth/users').set('Authorization', `Bearer ${adminToken}`);
      expect(forbidden.status).toBe(403);
    } finally {
      await prisma.user.update({ where: { id: adminId }, data: { role: 'admin' } });
    }
  });
});
