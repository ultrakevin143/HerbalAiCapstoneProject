import { lstat, realpath } from 'node:fs/promises';
import path from 'node:path';
import type { PoolClient, PoolConfig } from 'pg';
import { z } from 'zod';
import { buildPreparationPlan, preparationDigest, readPreparationSnapshots, validatePreparationConnectionUrl } from './herb-preparation-update.js';

const publicCatalogUrl = 'https://herbalaiph.vercel.app/api/herbs?limit=100';
const identitySchema = z.object({ id: z.string().min(1), localName: z.string().min(1), scientificName: z.string().min(1) });
const catalogSchema = z.object({ status: z.literal('success'), data: z.object({ herbs: z.array(identitySchema), total: z.number().int().nonnegative() }) });
type CatalogIdentity = z.infer<typeof identitySchema>;
export interface PreparationReleaseArguments {
  mode: 'help' | 'prepare' | 'apply'; backupFile: string;
  target: { host: string; database: string }; reviewerId: string; reviewedPlanSha256: string;
}

export const parsePreparationReleaseArguments = (args: string[]): PreparationReleaseArguments => {
  const result: PreparationReleaseArguments = { mode: 'help', backupFile: '', target: { host: '', database: '' }, reviewerId: '', reviewedPlanSha256: '' };
  if (args.length === 1 && args[0] === '--help') return result;
  const modes = new Set(['--prepare', '--apply']);
  const valueFlags = new Set(['--backup', '--expected-host', '--expected-database', '--reviewer-id', '--reviewed-plan-sha']);
  const seen = new Set<string>();
  const values = new Map<string, string>();
  let mode: 'prepare' | 'apply' | undefined;
  for (let index = 0; index < args.length; index++) {
    const argument = args[index]!;
    if (seen.has(argument)) throw new Error('Duplicate preparation-release argument.');
    seen.add(argument);
    if (modes.has(argument)) {
      if (mode) throw new Error('Choose exactly one explicit preparation-release mode.');
      mode = argument === '--prepare' ? 'prepare' : 'apply';
    } else if (valueFlags.has(argument)) {
      const value = args[++index];
      if (!value?.trim() || value.startsWith('--')) throw new Error('Required preparation-release argument is missing.');
      values.set(argument, value);
    } else throw new Error('Unknown preparation-release argument.');
  }
  if (!mode) throw new Error('Choose exactly one explicit preparation-release mode.');
  const required = (name: string): string => {
    const value = values.get(name);
    if (!value) throw new Error('Required preparation-release argument is missing.');
    return value;
  };
  result.mode = mode;
  result.backupFile = path.resolve(required('--backup'));
  result.target = { host: required('--expected-host'), database: required('--expected-database') };
  if (mode === 'apply') {
    result.reviewerId = required('--reviewer-id');
    result.reviewedPlanSha256 = required('--reviewed-plan-sha');
    if (!/^[a-f0-9]{64}$/.test(result.reviewedPlanSha256)) throw new Error('A reviewed SHA-256 plan digest is required.');
  } else if (values.has('--reviewer-id') || values.has('--reviewed-plan-sha')) {
    throw new Error('Apply-only arguments are not permitted in prepare mode.');
  }
  return result;
};

export const assertPreparationBackupPath = async (projectRoot: string, backupFile: string): Promise<string> => {
  const isInside = (root: string, candidate: string) => {
    const relative = path.relative(root, candidate);
    return !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
  };
  if (isInside(projectRoot, backupFile)) throw new Error('Keep recovery exports outside the repository.');
  const [resolvedRoot, resolvedParent] = await Promise.all([realpath(projectRoot), realpath(path.dirname(backupFile))]);
  const resolvedFile = path.join(resolvedParent, path.basename(backupFile));
  if (isInside(resolvedRoot, resolvedFile)) throw new Error('Keep recovery exports outside the repository, including linked paths.');
  const existing = await lstat(resolvedFile).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') return null;
    throw error;
  });
  if (existing && (!existing.isFile() || existing.isSymbolicLink())) throw new Error('Recovery export must be a regular file, not a link or directory.');
  return resolvedFile;
};

export const preparationPoolOptions = (connectionString: string): PoolConfig => {
  validatePreparationConnectionUrl(connectionString);
  return {
    connectionString, max: 1, connectionTimeoutMillis: 10_000,
    query_timeout: 15_000, statement_timeout: 10_000, lock_timeout: 5_000,
    idle_in_transaction_session_timeout: 15_000,
  };
};

export const readPublicPreparationCatalog = async (request: typeof fetch = fetch): Promise<CatalogIdentity[]> => {
  const response = await request(publicCatalogUrl, { signal: AbortSignal.timeout(20_000), cache: 'no-store' });
  if (!response.ok) throw new Error('Public catalog read failed.');
  const live = catalogSchema.parse(await response.json());
  const records = live.data.herbs.map(record => identitySchema.parse(record)).sort((left, right) => left.id.localeCompare(right.id));
  if (records.length !== live.data.total || new Set(records.map(record => record.id)).size !== records.length) {
    throw new Error('Public catalog was incomplete or duplicated.');
  }
  return records;
};

export const assertPreparationCatalogIdentity = async (client: PoolClient, records: CatalogIdentity[]): Promise<void> => {
  const database = await client.query('SELECT id, "localName", "scientificName" FROM "Herb" WHERE "publicationStatus" = $1 AND "isVerified" = true', ['PUBLISHED']);
  const identities = database.rows.map(row => identitySchema.parse(row)).sort((left, right) => left.id.localeCompare(right.id));
  if (preparationDigest(identities) !== preparationDigest(records)) throw new Error('Database does not match the full public catalog identity snapshot.');
};

export const readOnlyPreparationPlan = async (client: PoolClient, rawBatch: unknown, target: PreparationReleaseArguments['target'], catalog: CatalogIdentity[]) => {
  const ids = z.object({ herbs: z.array(z.object({ id: z.string() })) }).parse(rawBatch).herbs.map(record => record.id);
  await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
  try {
    await client.query("SET LOCAL statement_timeout = '10s'");
    await client.query("SET LOCAL lock_timeout = '5s'");
    await assertPreparationCatalogIdentity(client, catalog);
    return buildPreparationPlan(rawBatch, await readPreparationSnapshots(client, ids), target);
  } finally { await client.query('ROLLBACK'); }
};
