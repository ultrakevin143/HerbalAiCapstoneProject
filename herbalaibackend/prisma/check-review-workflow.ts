import assert from 'node:assert/strict';
import { prisma, closeDatabasePool } from '../src/lib/prisma.js';
import { createSuggestion, requestChanges, resubmitSuggestion, editSuggestion } from '../src/repositories/suggest.repository.js';

const ownerId = 'qa-review-workflow-contributor-20260914';
const reviewerId = 'qa-review-workflow-reviewer-20260914';
const localName = 'QA ONLY — Review workflow (not medicinal)';
const clean = async () => {
  await prisma.suggestedHerb.deleteMany({ where: { submitterId: ownerId, localName } });
  await prisma.user.deleteMany({ where: { id: { in: [ownerId, reviewerId] }, username: { startsWith: 'qa_review_workflow_' }, isBanned: true } });
};

try {
  if (process.argv.includes('--cleanup')) {
    await clean();
    console.log('Removed the temporary review fixture, two disabled QA accounts, and their test audit records.');
  } else {
    assert.equal(await prisma.user.count({ where: { id: { in: [ownerId, reviewerId] } } }), 0, 'QA fixture already exists; inspect it before running again.');
    const publicCount = await prisma.herb.count({ where: { publicationStatus: 'PUBLISHED' } });
    for (const [id, role] of [[ownerId, 'contributor'], [reviewerId, 'admin']] as const) {
      await prisma.user.create({ data: { id, username: `qa_review_workflow_${role}_20260914`, email: `qa-${role}-20260914@example.invalid`, password: 'disabled-test-account-no-login', name: `QA review ${role}`, role, isBanned: true } });
    }
    const data = { localName, scientificName: 'QA fixture — not a real plant', category: 'Other', medicinalUses: 'Test fixture. No medicinal use.', preparationMethod: 'Do not prepare or consume.', dosage: 'None. Test only.', informationSource: 'Synthetic test reference, not medical evidence.', imageUrl: null };
    const created = await createSuggestion({ ...data, submitterId: ownerId });
    assert.equal(created.status, 'Pending');
    assert.equal(await resubmitSuggestion(created.id, ownerId, data), null);
    const returned = await requestChanges(created.id, reviewerId, 'QA: clarify that this is a test fixture.');
    assert.equal(returned.status, 'ChangesRequested');
    assert.equal(await resubmitSuggestion(created.id, reviewerId, data), null);
    const revised = await resubmitSuggestion(created.id, ownerId, { ...data, warnings: 'QA ONLY. Do not publish.' });
    assert.equal(revised?.status, 'Pending');
    assert.deepEqual(revised?.references, []);
    assert.ok(revised);
    const edit = { ...data, imageUrl: '', warnings: 'QA ONLY. Do not publish.', revision: revised.revision, reviewNotes: 'QA edit: two scoped test citations added.', references: [
      { title: 'QA identity reference', publisher: 'Test fixture', url: '', citation: 'Synthetic citation A', publishedAt: '2026', supports: ['identity' as const] },
      { title: 'QA safety reference', publisher: 'Test fixture', url: '', citation: 'Synthetic citation B', publishedAt: '2026', supports: ['warnings' as const] },
    ] };
    const edited = await editSuggestion(created.id, reviewerId, edit);
    assert.equal(edited?.revision, revised.revision + 1);
    assert.equal(await editSuggestion(created.id, reviewerId, edit), null);
    const audit = await prisma.auditLog.findFirst({ where: { adminId: reviewerId, action: 'EDIT_SUGGESTION', targetId: String(created.id) } });
    assert.ok(audit?.details);
    assert.equal(await prisma.herb.count({ where: { publicationStatus: 'PUBLISHED' } }), publicCount);
    console.log(JSON.stringify({ passed: ['pending creation', 'pending resubmit blocked', 'request changes', 'wrong owner blocked', 'owner resubmit', 'reference reset', 'admin edit with two references', 'stale edit blocked', 'audit snapshot saved', 'public library unchanged'], pendingFixtureId: created.id }));
  }
} finally {
  await closeDatabasePool();
}
