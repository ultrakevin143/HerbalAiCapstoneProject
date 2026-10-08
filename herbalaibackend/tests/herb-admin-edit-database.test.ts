import { randomUUID } from 'node:crypto';
import { createHash } from 'node:crypto';
import type { Prisma } from '@prisma/client';
import express from 'express';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { adminEditDatabaseBoundary } from './helpers/admin-edit-database-boundary.js';

const faults = vi.hoisted(() => ({ audit: false, vector: false, embed: vi.fn() }));
vi.mock('../src/services/ai/core/gemini-service.js', () => ({ generateEmbedding: faults.embed }));
vi.mock('../src/lib/prisma.js', async importOriginal => {
  const original = await importOriginal<typeof import('../src/lib/prisma.js')>();
  return { ...original, prisma: new Proxy(original.prisma, {
    get(target, property) {
      if (property !== '$transaction') return Reflect.get(target, property);
      return <Result>(operation: (transaction: Prisma.TransactionClient) => Promise<Result>) => target.$transaction(transaction => operation(new Proxy(transaction, {
        get(actual, member) {
          if (member === 'auditLog' && faults.audit) return {
            create: (args: Prisma.AuditLogCreateArgs) => actual.auditLog.create({ ...args, data: { ...args.data as Prisma.AuditLogUncheckedCreateInput, adminId: 'TEST-missing-admin-for-foreign-key-failure' } }),
          };
          if (member === '$executeRaw') return (query: TemplateStringsArray | Prisma.Sql, ...values: unknown[]) => {
            if (faults.vector && Array.isArray(query) && query.join('').includes('SET embedding')) return actual.$executeRaw`SELECT 1 / 0`;
            return actual.$executeRaw(query, ...values);
          };
          return Reflect.get(actual, member);
        },
      })));
    },
  }) };
});

import { prisma, closeDatabasePool } from '../src/lib/prisma.js';
import { HerbController } from '../src/controllers/herb.controller.js';
import { herbEmbeddingText } from '../src/content/herb-embedding.js';

const enabled = adminEditDatabaseBoundary(process.env['HERBALAI_TEST_DATABASE_URL'], process.env['DATABASE_URL'], Boolean(process.env['CI']));
const adminId = `qa-admin-edit-${randomUUID()}`;
const created: string[] = [];
const oldVector = Array(768).fill(0.1) as number[];
const newVector = Array(768).fill(0.2) as number[];
const alphabeticId = () => randomUUID().replaceAll('-', '').replace(/\d/g, digit => 'abcdefghij'[Number(digit)]!);
const app = express();
app.use(express.json());
app.put('/herbs/:id', (req, _res, next) => { Object.assign(req, { user: { userId: adminId, role: 'admin' } }); next(); }, new HerbController().updateHerb);
app.use((error: Error & { status?: number }, _req: express.Request, res: express.Response, _next: express.NextFunction) => { res.status(error.status ?? 500).json({ message: error.message }); });
const edit = (id: string, body: object) => request(app).put(`/herbs/${id}`).send(body);
const snapshot = async (id: string) => (await prisma.$queryRaw<{ preparationMethod: string; scientificName: string; updatedAt: Date; vector: string | null }[]>`SELECT "preparationMethod", "scientificName", "updatedAt", embedding::text AS vector FROM "Herb" WHERE id = ${id}`)[0]!;
const auditCount = (id: string) => prisma.auditLog.count({ where: { adminId, targetId: id } });
const fixture = async (published = true) => {
  const id = `qa-herb-edit-${randomUUID()}`;
  const herb = await prisma.herb.create({ data: {
    id, localName: `TEST ONLY edit ${id}`, scientificName: `Testus qa${alphabeticId()}`, category: 'TEST ONLY',
    medicinalUses: 'No medicinal claims. Synthetic acceptance fixture.', preparationMethod: 'TEST ONLY original preparation.', dosage: 'No dose.',
    isVerified: published, publicationStatus: published ? 'PUBLISHED' : 'DRAFT', evidenceClass: 'UNASSESSED',
  } });
  created.push(id);
  await prisma.$executeRaw`UPDATE "Herb" SET embedding = ${JSON.stringify(oldVector)}::vector WHERE id = ${id}`;
  return herb;
};

describe.skipIf(!enabled)('administrator edits with real PostgreSQL vectors and audit rollback', () => {
  beforeAll(async () => {
    const extensions = await prisma.$queryRaw<{ extname: string }[]>`SELECT extname FROM pg_extension WHERE extname = 'vector'`;
    if (!extensions.length) throw new Error('Real pgvector is required; do not substitute text vectors or skip this CI gate.');
    await prisma.user.create({ data: { id: adminId, username: adminId, email: `${adminId}@example.invalid`, password: 'TEST ONLY disabled password', name: 'TEST ONLY edit reviewer', role: 'admin', isBanned: true } });
  });
  beforeEach(() => {
    faults.audit = false;
    faults.vector = false;
    faults.embed.mockReset().mockResolvedValue(newVector);
  });
  afterAll(async () => {
    try {
      await prisma.auditLog.deleteMany({ where: { adminId } });
      await prisma.herb.deleteMany({ where: { id: { in: created } } });
      await prisma.user.deleteMany({ where: { id: adminId } });
    } finally { await closeDatabasePool(); }
  });

  it('commits current text, actual vector and matching audit input hash together', async () => {
    const herb = await fixture();
    const preparationMethod = 'TEST ONLY corrected sourced description; not instructions.';
    expect((await edit(herb.id, { preparationMethod })).status).toBe(200);
    const after = await snapshot(herb.id);
    expect(after.preparationMethod).toBe(preparationMethod);
    expect(JSON.parse(after.vector!)).toEqual(newVector);
    const log = await prisma.auditLog.findFirstOrThrow({ where: { adminId, targetId: herb.id } });
    expect(log.details).toMatchObject({ embeddingInputSha256: createHash('sha256').update(herbEmbeddingText({ ...herb, preparationMethod })).digest('hex') });
  });
  it.each(['audit', 'vector'] as const)('rolls back text and vector when a real %s database write fails', async fault => {
    const herb = await fixture();
    const before = await snapshot(herb.id);
    faults[fault] = true;
    expect((await edit(herb.id, { preparationMethod: 'TEST ONLY must roll back.' })).status).toBe(500);
    expect(await snapshot(herb.id)).toEqual(before);
    expect(await auditCount(herb.id)).toBe(0);
  });
  it('saves nothing when the embedding provider fails', async () => {
    const herb = await fixture();
    const before = await snapshot(herb.id);
    faults.embed.mockRejectedValue(new Error('TEST ONLY provider failure.'));
    expect((await edit(herb.id, { preparationMethod: 'TEST ONLY unsaved text.' })).status).toBe(503);
    expect(await snapshot(herb.id)).toEqual(before);
    expect(await auditCount(herb.id)).toBe(0);
  });
  it('rejects a concurrent snapshot change rather than overwriting it', async () => {
    const herb = await fixture();
    faults.embed.mockImplementationOnce(async () => {
      await prisma.herb.update({ where: { id: herb.id }, data: { preparationMethod: 'TEST ONLY concurrent edit.', updatedAt: new Date(herb.updatedAt.getTime() + 1000) } });
      return newVector;
    });
    expect((await edit(herb.id, { preparationMethod: 'TEST ONLY stale edit.' })).status).toBe(409);
    expect((await snapshot(herb.id)).preparationMethod).toBe('TEST ONLY concurrent edit.');
    expect(await auditCount(herb.id)).toBe(0);
  });
  it('allows exactly one concurrent edit to claim the same canonical scientific identity', async () => {
    const first = await fixture(), second = await fixture();
    const scientificName = `Testus collision${alphabeticId()}`;
    const outcomes = await Promise.all([edit(first.id, { scientificName }), edit(second.id, { scientificName })]);
    expect(outcomes.map(result => result.status).sort()).toEqual([200, 400]);
    expect(await prisma.herb.count({ where: { id: { in: [first.id, second.id] }, scientificName } })).toBe(1);
    expect(await prisma.auditLog.count({ where: { adminId, targetId: { in: [first.id, second.id] } } })).toBe(1);
  });
  it('removes a draft vector without generating unpublished content', async () => {
    const herb = await fixture(false);
    expect((await edit(herb.id, { preparationMethod: 'TEST ONLY draft text.' })).status).toBe(200);
    expect((await snapshot(herb.id)).vector).toBeNull();
    expect(faults.embed).not.toHaveBeenCalled();
  });
});
