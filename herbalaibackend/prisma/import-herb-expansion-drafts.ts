import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { buildExpansionDraftImportPlan, buildExpansionDraftStageSql, stageExpansionDrafts } from '../src/content/herb-expansion-draft-import.js';
import { assertPreparationTarget, preparationDigest } from '../src/content/herb-preparation-update.js';
import { loadHeldExpansionPlans } from './load-herb-expansion-plans.js';

export function parseDraftImportArguments(args: string[]) {
  const mode = args[0];
  if (mode !== '--plan' && mode !== '--stage' && mode !== '--export-sql') throw new Error('Choose --plan, --stage or --export-sql; no publish mode exists.');
  const allowed = mode === '--plan' ? ['--target-host', '--target-database', '--output']
    : mode === '--export-sql' ? ['--target-host', '--target-database', '--file', '--sha256', '--snapshot', '--output', '--backup', '--reviewer-id']
    : ['--target-host', '--target-database', '--file', '--sha256', '--backup', '--reviewer-id'];
  const values = new Map<string, string>();
  for (let index = 1; index < args.length; index += 2) {
    const key = args[index];
    const value = args[index + 1];
    if (!key || !allowed.includes(key) || values.has(key) || !value || value.startsWith('--')) {
      throw new Error('Unknown, repeated or incomplete draft import argument.');
    }
    values.set(key, value);
  }
  if (allowed.some(key => !values.has(key))) throw new Error('Missing required draft import argument.');
  return { mode, values };
}

export async function runDraftImport(args: string[], environment: NodeJS.ProcessEnv) {
  const { mode, values } = parseDraftImportArguments(args);
  const target = { host: values.get('--target-host')!, database: values.get('--target-database')! };
  if (mode === '--plan') {
    const { queue, plans } = await loadHeldExpansionPlans();
    const plan = buildExpansionDraftImportPlan(queue, plans, target);
    await writeFile(values.get('--output')!, JSON.stringify(plan, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
    return { plannedDrafts: plan.rows.length, planSha256: preparationDigest(plan), published: 0, databaseConnected: false };
  }
  if (mode === '--export-sql') {
    const plan: unknown = JSON.parse(await readFile(values.get('--file')!, 'utf8'));
    const snapshot: { target: unknown; capturedAt: string; identities: unknown[] } = JSON.parse(await readFile(values.get('--snapshot')!, 'utf8'));
    if (preparationDigest(plan) !== values.get('--sha256') || preparationDigest(snapshot.target) !== preparationDigest(target)) {
      throw new Error('SQL export target or reviewed digest changed.');
    }
    const script = buildExpansionDraftStageSql(plan, snapshot, values.get('--reviewer-id')!);
    await writeFile(values.get('--backup')!, JSON.stringify({ status: 'INSERT_ONLY_DRAFT_IMPORT_BACKUP',
      planSha256: values.get('--sha256'), snapshot, plan }, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
    await writeFile(values.get('--output')!, script, { flag: 'wx', mode: 0o600 });
    return { sqlExported: true, scriptSha256: preparationDigest(script), published: 0, databaseConnected: false };
  }
  const connectionUrl = environment['HERBALAI_IMPORT_DATABASE_URL'];
  if (!connectionUrl) throw new Error('Set HERBALAI_IMPORT_DATABASE_URL explicitly; no database fallback is used.');
  assertPreparationTarget(connectionUrl, target);
  const plan: unknown = JSON.parse(await readFile(values.get('--file')!, 'utf8'));
  const pool = new pg.Pool({ connectionString: connectionUrl, max: 1, connectionTimeoutMillis: 10_000 });
  try {
    const client = await pool.connect();
    try {
      return await stageExpansionDrafts(client, plan, { connectionUrl, independentlyConfirmedTarget: target,
        reviewedPlanSha256: values.get('--sha256')!, backupFile: values.get('--backup')!, reviewerId: values.get('--reviewer-id')! });
    } finally { client.release(); }
  } finally { await pool.end(); }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runDraftImport(process.argv.slice(2), process.env).then(result => {
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  }).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'Unknown failure';
    process.stderr.write(/^(Choose|Unknown, repeated|Missing required|Set HERBALAI_IMPORT_DATABASE_URL)/.test(message)
      ? `${message}\n` : 'Draft import failed. No public publication was attempted; sensitive connection diagnostics are withheld.\n');
    process.exitCode = 1;
  });
}
