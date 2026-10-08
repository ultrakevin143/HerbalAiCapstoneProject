import { describe, expect, it } from 'vitest';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { loadHeldExpansionPlans } from '../prisma/load-herb-expansion-plans.js';
import { parseDraftImportArguments, runDraftImport } from '../prisma/import-herb-expansion-drafts.js';
import { buildExpansionDraftImportPlan } from '../src/content/herb-expansion-draft-import.js';
import { preparationDigest } from '../src/content/herb-preparation-update.js';

const target = { host: '127.0.0.1', database: 'herbalai_test' };

describe('insert-only expansion draft import', () => {
  it('builds all fifty drafts with source tags and preparation text, but no publication or embedding clearance', async () => {
    const { queue, plans } = await loadHeldExpansionPlans();
    const plan = buildExpansionDraftImportPlan(queue, plans, target);
    expect(plan.rows).toHaveLength(50);
    expect(plan.rows.filter(row => row.proposedData.imageUrl)).toHaveLength(41);
    expect(plan.rows.every(row => row.proposedData.preparationMethod && row.proposedSources.length
      && row.proposedData.publicationStatus === 'DRAFT' && !row.proposedData.isVerified
      && row.proposedData.embedding === null)).toBe(true);
    expect(plan).toMatchObject({ publicationAllowed: false, embeddingsAllowed: false, existingRecordUpdatesAllowed: false });
  });

  it('does not invent a region or a cover to make private drafts look complete', async () => {
    const { queue, plans } = await loadHeldExpansionPlans();
    const plan = buildExpansionDraftImportPlan(queue, plans, target);
    const row = plan.rows.find(value => value.proposedData.localName === 'Lokoloko');
    expect(row?.proposedData.regionFound).toBeUndefined();
    expect(row?.proposedData.imageUrl).toBeUndefined();
    expect(row?.reviewGaps.length).toBeGreaterThan(0);
  });

  it.each(['publicationStatus', 'isVerified', 'embedding', 'reviewedById'])('rejects altered release flags: %s', async field => {
    const { queue, plans } = await loadHeldExpansionPlans();
    plans[0]!.draftRows[0]!.proposedData[field] = field === 'isVerified' ? true : 'PUBLISHED';
    expect(() => buildExpansionDraftImportPlan(queue, plans, target)).toThrow();
  });

  it('rejects duplicate candidate ownership', async () => {
    const { queue, plans } = await loadHeldExpansionPlans();
    plans[1]!.draftRows[0] = structuredClone(plans[0]!.draftRows[0]!);
    expect(() => buildExpansionDraftImportPlan(queue, plans, target)).toThrow('Duplicate');
  });

  it.each([{ args: ['--publish'] }, { args: ['--stage'] }, { args: ['--plan', '--target-host', '--output'] },
    { args: ['--plan', '--target-host', 'one', '--target-host', 'two'] }])('rejects unsafe/incomplete CLI arguments: %j', ({ args }) => {
    expect(() => parseDraftImportArguments(args)).toThrow();
  });

  it('never falls back to inherited production database variables', async () => {
    await expect(runDraftImport(['--stage', '--target-host', target.host, '--target-database', target.database,
      '--file', 'unused.json', '--sha256', '0'.repeat(64), '--backup', 'unused-backup.json', '--reviewer-id', 'qa-admin'],
    { DATABASE_URL: 'postgresql://do-not-use.invalid/live' })).rejects.toThrow('no database fallback');
  });

  it('exports a guarded SQL script only after saving its exact plan and identity snapshot backup', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'herbalai-draft-export-'));
    try {
      const { queue, plans } = await loadHeldExpansionPlans();
      const plan = buildExpansionDraftImportPlan(queue, plans, target);
      const snapshot = { target, capturedAt: new Date().toISOString(), identities: [] };
      const filename = (name: string) => path.join(directory, name);
      await writeFile(filename('plan.json'), JSON.stringify(plan));
      await writeFile(filename('snapshot.json'), JSON.stringify(snapshot));
      const args = ['--export-sql', '--target-host', target.host, '--target-database', target.database,
        '--file', filename('plan.json'), '--sha256', preparationDigest(plan), '--snapshot', filename('snapshot.json'),
        '--output', filename('import.sql'), '--backup', filename('backup.json'), '--reviewer-id', 'qa-admin'];
      await expect(runDraftImport(args, {})).resolves.toMatchObject({ sqlExported: true, published: 0, databaseConnected: false });
      expect(JSON.parse(await readFile(filename('backup.json'), 'utf8'))).toMatchObject({ plan, snapshot });
      const script = await readFile(filename('import.sql'), 'utf8');
      expect(script).toContain('All-state identity snapshot changed; import aborted');
      expect(script).toContain('STAGE_HERB_DRAFT');
      await expect(runDraftImport(args, {})).rejects.toMatchObject({ code: 'EEXIST' });
      expect(await readFile(filename('import.sql'), 'utf8')).toBe(script);
    } finally {
      if (path.dirname(path.resolve(directory)) === path.resolve(tmpdir())
        && path.basename(directory).startsWith('herbalai-draft-export-')) await rm(directory, { recursive: true, force: true });
    }
  });
});
