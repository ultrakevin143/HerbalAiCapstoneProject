import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import pg from 'pg';
import { applyPreparationPlan, assertPreparationTarget, preparationDigest,
  preparationEmbeddingText, readApprovedPreparationPlan, writePreparationBackup } from '../src/content/herb-preparation-update.js';
import { assertPreparationBackupPath, assertPreparationCatalogIdentity, parsePreparationReleaseArguments,
  preparationPoolOptions, readOnlyPreparationPlan, readPublicPreparationCatalog } from '../src/content/herb-preparation-release.js';

const main = async (): Promise<void> => {
  const releaseArguments = parsePreparationReleaseArguments(process.argv.slice(2));
  if (releaseArguments.mode === 'help') {
    console.log('Preparation-only release: --prepare or --apply, --backup <outside-repository file>, --expected-host <confirmed host>, --expected-database <confirmed database>. Apply also requires --reviewer-id <active admin> and --reviewed-plan-sha <reviewed digest>. No publish, upsert or bootstrap mode exists.');
    return;
  }
  const { target, reviewerId, reviewedPlanSha256 } = releaseArguments;
  const projectRoot = fileURLToPath(new URL('../../', import.meta.url));
  const backupFile = await assertPreparationBackupPath(projectRoot, releaseArguments.backupFile);
  dotenv.config({ quiet: true });
  const connectionUrl = process.env['DATABASE_URL'] ?? '';
  assertPreparationTarget(connectionUrl, target);
  const catalog = await readPublicPreparationCatalog();
  const pool = new pg.Pool(preparationPoolOptions(connectionUrl));
  try {
    const client = await pool.connect();
    try {
      if (releaseArguments.mode === 'prepare') {
        const rawBatch: unknown = JSON.parse(await readFile(new URL('../content/herbs/expansion-batch-02.json', import.meta.url), 'utf8'));
        const plan = await readOnlyPreparationPlan(client, rawBatch, target, catalog);
        await writePreparationBackup(plan, backupFile);
        console.log(JSON.stringify({ mode: 'PREPARE_READ_ONLY', records: plan.records.length, planSha256: preparationDigest(plan), productionWrites: 0,
          note: 'Review the exported plan, part-specific safety and isolated PostgreSQL tests before --apply.' }));
        return;
      }
      await assertPreparationCatalogIdentity(client, catalog);
      const backup = JSON.parse(await readFile(backupFile, 'utf8')) as { plan?: unknown };
      const approval = { connectionUrl, independentlyConfirmedTarget: target, reviewedPlanSha256, backupFile, reviewerId };
      const plan = await readApprovedPreparationPlan(backup.plan, approval);
      const batch: unknown = JSON.parse(await readFile(new URL('../content/herbs/expansion-batch-02.json', import.meta.url), 'utf8'));
      if (preparationDigest(batch) !== plan.batchSha256) throw new Error('Preparation evidence batch changed after review.');
      const { generateEmbedding } = await import('../src/services/ai/core/gemini-service.js');
      const vectors = new Map<string, number[]>();
      for (const record of plan.records) vectors.set(record.before.id, await generateEmbedding(preparationEmbeddingText(record)));
      const outcome = await applyPreparationPlan(client, plan, vectors, approval);
      console.log(JSON.stringify({ mode: 'PREPARATION_UPDATE_COMMITTED', ...outcome,
        note: 'Verify live detail/list reads after server cache expiry or approved restart, then reload browser caches and check Dr. Ai. Do not replay an ambiguous commit.' }));
    } finally { client.release(); }
  } finally { await pool.end(); }
};

main().catch(() => {
  console.error('Preparation release stopped. No automatic retry was performed. Review target, plan, backup, embeddings and transaction state privately before retrying; a lost commit response must be reconciled first.');
  process.exitCode = 1;
});
