import { randomUUID } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import type { Prisma } from '@prisma/client';

const scope = vi.hoisted(() => ({ transaction: null as Prisma.TransactionClient | null }));
vi.mock('../src/lib/prisma.js', async (importOriginal) => {
  const original = await importOriginal<typeof import('../src/lib/prisma.js')>();
  return { ...original, prisma: new Proxy(original.prisma, {
    get(target, property) {
      if (!scope.transaction) return Reflect.get(target, property);
      if (property === '$transaction') return (callback: (transaction: Prisma.TransactionClient) => unknown) => callback(scope.transaction!);
      return Reflect.get(scope.transaction, property);
    },
  }) };
});

import { createSuggestion, requestChanges, rejectSuggestion, resubmitSuggestion, editSuggestion, approveSuggestion } from '../src/repositories/suggest.repository.js';

describe('Review to publication in a rolled-back database transaction', () => {
  it('preserves revised content, scoped references, embedding and audit history without publishing test data', async () => {
    const { prisma } = await vi.importActual<typeof import('../src/lib/prisma.js')>('../src/lib/prisma.js');
    const suffix = randomUUID();
    const ownerId = `qa-owner-${suffix}`;
    const reviewerId = `qa-reviewer-${suffix}`;
    const rollback = new Error('Intentional QA rollback');
    let herbId: string | undefined;
    try {
      await prisma.$transaction(async (transaction) => {
        scope.transaction = transaction;
        for (const [id, role] of [[ownerId, 'contributor'], [reviewerId, 'admin']] as const) {
          await transaction.user.create({ data: { id, role, username: id, email: `${id}@example.invalid`, password: 'disabled-qa-account', name: 'QA transaction fixture', isBanned: true } });
        }
        const content = { localName: `QA ${suffix}`, scientificName: `QA fixture ${suffix}`, category: 'Test only', medicinalUses: 'No medicinal use', preparationMethod: 'Do not use', dosage: 'None', informationSource: 'QA synthetic citation' };
        const submission = await createSuggestion({ ...content, submitterId: ownerId });
        await requestChanges(submission.id, reviewerId, 'Clarify safety notes for QA.');
        expect(await resubmitSuggestion(submission.id, reviewerId, content)).toBeNull();
        const revised = await resubmitSuggestion(submission.id, ownerId, { ...content, warnings: 'Synthetic test only' });
        expect(revised?.status).toBe('Pending');
        expect(revised?.references).toEqual([]);
        const references = [
          { title: 'Identity citation', publisher: 'QA', url: '', citation: 'Synthetic A', publishedAt: '2026', supports: ['identity' as const] },
          { title: 'Safety citation', publisher: 'QA', url: 'https://example.invalid/qa', citation: '', publishedAt: '2026', supports: ['warnings' as const] },
        ];
        const edit = { ...content, warnings: 'Synthetic test only', imageUrl: '', references, reviewNotes: 'QA reviewed', revision: revised!.revision };
        const edited = await editSuggestion(submission.id, reviewerId, edit);
        expect(edited).not.toBeNull();
        expect(await editSuggestion(submission.id, reviewerId, edit)).toBeNull();
        expect(await requestChanges(submission.id, reviewerId, 'Outdated reviewer notes', revised!.revision)).toBeNull();
        expect(await rejectSuggestion(submission.id, reviewerId, revised!.revision)).toBeNull();
        expect(await approveSuggestion(submission.id, reviewerId, null, 'DOCUMENTED_TRADITIONAL_USE', 'Stale approval', revised!.revision)).toBeNull();
        const vector = `[${Array.from({ length: 768 }, (_, index) => index === 0 ? 1 : 0).join(',')}]`;
        const herb = await approveSuggestion(submission.id, reviewerId, vector, 'DOCUMENTED_TRADITIONAL_USE', 'QA approval', edited!.revision);
        herbId = herb!.id;
        expect(herb).toMatchObject({ warnings: 'Synthetic test only', publicationStatus: 'PUBLISHED', isVerified: true, reviewedById: reviewerId, sourceSuggestionId: submission.id, provenance: 'COMMUNITY_SUBMISSION' });
        expect(herb!.sources).toHaveLength(2);
        expect(herb!.sources).toEqual(expect.arrayContaining([
          expect.objectContaining({ title: 'Identity citation', supports: ['identity'], citation: 'Synthetic A' }),
          expect.objectContaining({ title: 'Safety citation', supports: ['warnings'], url: 'https://example.invalid/qa' }),
        ]));
        const embedded = await transaction.$queryRaw<{ present: boolean }[]>`SELECT embedding IS NOT NULL AS present FROM "Herb" WHERE id = ${herbId}`;
        expect(embedded[0]?.present).toBe(true);
        expect(await requestChanges(submission.id, reviewerId, 'Concurrent stale return', edited!.revision)).toBeNull();
        expect(await rejectSuggestion(submission.id, reviewerId, edited!.revision)).toBeNull();
        expect(await approveSuggestion(submission.id, reviewerId, vector, 'DOCUMENTED_TRADITIONAL_USE', 'Duplicate approval', edited!.revision)).toBeNull();
        expect(await transaction.suggestedHerb.findUnique({ where: { id: submission.id } })).toMatchObject({ status: 'Approved' });
        const logs = await transaction.auditLog.findMany({ where: { adminId: reviewerId }, orderBy: { id: 'asc' } });
        expect(logs.map((log) => log.action)).toEqual(['REQUEST_CHANGES_SUGGESTION', 'EDIT_SUGGESTION', 'APPROVE_SUGGESTION']);
        expect(await resubmitSuggestion(submission.id, ownerId, content)).toBeNull();
        expect(await editSuggestion(submission.id, reviewerId, { ...edit, revision: edited!.revision + 1 })).toBeNull();
        const rejectable = await createSuggestion({ ...content, submitterId: ownerId });
        expect(await rejectSuggestion(rejectable.id, reviewerId, rejectable.revision)).toMatchObject({ status: 'Rejected', revision: rejectable.revision + 1 });
        expect(await requestChanges(rejectable.id, reviewerId, 'Late return', rejectable.revision)).toBeNull();
        expect(await transaction.auditLog.count({ where: { targetId: String(rejectable.id), adminId: reviewerId } })).toBe(1);
        throw rollback;
      }, { maxWait: 20000, timeout: 60000 });
    } catch (error) {
      if (error !== rollback) throw error;
    } finally {
      scope.transaction = null;
    }
    expect(await prisma.user.count({ where: { id: { in: [ownerId, reviewerId] } } })).toBe(0);
    expect(await prisma.herb.count({ where: { id: herbId! } })).toBe(0);
  }, 90000);
});
