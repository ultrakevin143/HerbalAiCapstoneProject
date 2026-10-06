import { readFile, writeFile } from 'node:fs/promises';
import { Role } from '@prisma/client';
import { z } from 'zod';
import { assertPreparationBackupPath } from './herb-preparation-release.js';
import { preparationDigest, validatePreparationConnectionUrl } from './herb-preparation-update.js';
import { planPreparationSourceTags, preparationSourceTagReviewSchema } from './herb-preparation-source-tags.js';

const text = z.string().min(1).refine(value => value.trim().length > 0);
const targetSchema = z.strictObject({ host: text, database: text, port: z.number().int().min(1).max(65535) });
const sourceSchema = z.looseObject({
  id: z.number().int().positive(), herbId: text, title: text, publisher: z.string().nullable(),
  url: z.string().nullable(), citation: z.string().nullable(), supports: z.array(text),
  accessedAt: text.nullable(), publishedAt: z.string().nullable(), createdAt: text,
});
const snapshotSchema = z.looseObject({
  id: text, localName: text, scientificName: text, preparationMethod: text, dosage: text,
  warnings: z.string().nullable(), imageUrl: z.string().nullable(),
  publicationStatus: z.literal('PUBLISHED'), isVerified: z.literal(true),
  embedding: z.string().nullable(), createdAt: text, updatedAt: text, sources: z.array(sourceSchema),
});
const planSchema = z.strictObject({
  status: z.literal('REVIEW_REQUIRED_SOURCE_TAG_UPDATE'), preparedAt: z.iso.datetime(),
  target: targetSchema, review: preparationSourceTagReviewSchema,
  snapshots: z.array(snapshotSchema).min(1).max(2),
});
export type SourceTagReleasePlan = z.infer<typeof planSchema>;
export interface SourceTagClient {
  connectionParameters: { host: string; database: string; port: number };
  query(sql: string, values?: unknown[]): Promise<{ rows: Record<string, unknown>[]; rowCount: number | null }>;
}
export interface SourceTagApproval {
  connectionUrl: string; independentlyConfirmedTarget: unknown; reviewedPlanSha256: string;
  projectRoot: string; backupFile: string; reviewerId: string; now?: Date;
}
export class SourceTagOutcomeUncertainError extends Error {
  readonly reconciliationRequired = true;
  constructor() { super('Source-tag transaction outcome is uncertain. Discard the connection and reconcile source rows and audit records before any retry.'); }
}

const rollbackSourceTagTransaction = async (client: SourceTagClient): Promise<void> => {
  try { await client.query('ROLLBACK'); } catch { throw new SourceTagOutcomeUncertainError(); }
};

const utcTimestamp = (value: string | null): string => {
  if (!value) throw new Error('Source access timestamp is missing.');
  const normalized = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(value) ? `${value}Z` : value;
  return z.iso.datetime({ offset: true }).parse(normalized);
};

const amendments = (plan: SourceTagReleasePlan) => planPreparationSourceTags(plan.review, {
  checkedAt: plan.preparedAt, publicUrl: 'https://herbalaiph.vercel.app/api/herbs?limit=100',
  status: 200, productionWritesPerformed: false,
  records: plan.snapshots.map(snapshot => ({ ...snapshot, sources: snapshot.sources.map(source => ({
    ...source, accessedAt: utcTimestamp(source.accessedAt),
  })) })),
}).changes;

export const buildSourceTagReleasePlan = (
  review: unknown, snapshots: unknown[], target: unknown, now = new Date(),
): SourceTagReleasePlan => {
  const plan = planSchema.parse({ status: 'REVIEW_REQUIRED_SOURCE_TAG_UPDATE', preparedAt: now.toISOString(), target, review, snapshots });
  plan.snapshots.sort((left, right) => left.id.localeCompare(right.id));
  for (const snapshot of plan.snapshots) snapshot.sources.sort((left, right) => left.id - right.id);
  const selectedIds = plan.review.records.map(record => record.herbId).sort();
  if (preparationDigest(selectedIds) !== preparationDigest(plan.snapshots.map(snapshot => snapshot.id).sort())) {
    throw new Error('Full snapshots must contain exactly the reviewed herbs.');
  }
  const changes = amendments(plan);
  if (!changes.length) throw new Error('All reviewed source tags are already present; no release is needed.');
  return plan;
};

export const readSourceTagSnapshots = async (client: SourceTagClient, ids: string[], lock = false): Promise<unknown[]> => {
  const herbs = await client.query(`SELECT to_jsonb(herb) || jsonb_build_object('embedding', herb.embedding::text) AS document
    FROM "Herb" herb WHERE id = ANY($1::text[]) ORDER BY id${lock ? ' FOR UPDATE OF herb' : ''}`, [ids]);
  const sources = await client.query(`SELECT to_jsonb(source) AS document FROM "HerbSource" source
    WHERE "herbId" = ANY($1::text[]) ORDER BY id${lock ? ' FOR UPDATE OF source' : ''}`, [ids]);
  const sourceDocuments = sources.rows.map(row => sourceSchema.parse(row['document']));
  return herbs.rows.map(row => ({ ...z.record(z.string(), z.unknown()).parse(row['document']),
    sources: sourceDocuments.filter(source => source.herbId === (row['document'] as Record<string, unknown>)['id']),
  }));
};

export const prepareSourceTagRelease = async (client: SourceTagClient, reviewInput: unknown, targetInput: unknown, now = new Date()) => {
  const review = preparationSourceTagReviewSchema.parse(reviewInput);
  const target = targetSchema.parse(targetInput);
  const clientTarget = { host: client.connectionParameters.host, database: client.connectionParameters.database, port: client.connectionParameters.port };
  if (preparationDigest(clientTarget) !== preparationDigest(target)) throw new Error('Snapshot client does not match the confirmed target.');
  try {
    await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
    await client.query("SET LOCAL statement_timeout = '10s'");
    await client.query("SET LOCAL TIME ZONE 'UTC'");
    const database = await client.query('SELECT current_database() AS database');
    if (database.rows[0]?.['database'] !== target.database) throw new Error('Snapshot database identity changed.');
    return buildSourceTagReleasePlan(review, await readSourceTagSnapshots(client, review.records.map(record => record.herbId)), target, now);
  } finally { await rollbackSourceTagTransaction(client); }
};

export const writeSourceTagBackup = async (projectRoot: string, filename: string, rawPlan: unknown): Promise<void> => {
  const parsed = planSchema.parse(rawPlan);
  const plan = buildSourceTagReleasePlan(parsed.review, parsed.snapshots, parsed.target, new Date(parsed.preparedAt));
  if (preparationDigest(plan) !== preparationDigest(rawPlan)) throw new Error('Source-tag plan is not canonical.');
  const backupFile = await assertPreparationBackupPath(projectRoot, filename);
  await writeFile(backupFile, JSON.stringify({ planSha256: preparationDigest(plan), plan }, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
};

const approve = async (client: SourceTagClient, rawPlan: unknown, options: SourceTagApproval) => {
  const parsed = planSchema.parse(rawPlan);
  const plan = buildSourceTagReleasePlan(parsed.review, parsed.snapshots, parsed.target, new Date(parsed.preparedAt));
  const target = targetSchema.parse(options.independentlyConfirmedTarget);
  const connection = validatePreparationConnectionUrl(options.connectionUrl);
  const urlTarget = { host: connection.hostname, database: decodeURIComponent(connection.pathname.slice(1)), port: Number(connection.port || 5432) };
  const clientTarget = { host: client.connectionParameters.host, database: client.connectionParameters.database, port: client.connectionParameters.port };
  if ([rawPlan, parsed].some(value => preparationDigest(value) !== preparationDigest(plan))) throw new Error('Source-tag plan changed or is not canonical.');
  if ([target, urlTarget, clientTarget].some(value => preparationDigest(value) !== preparationDigest(plan.target))) {
    throw new Error('Plan, actual client and independently confirmed database target must match exactly.');
  }
  const age = (options.now ?? new Date()).getTime() - Date.parse(plan.preparedAt);
  if (!Number.isFinite(age) || age < 0 || age > 15 * 60_000) throw new Error('Source-tag plan is stale; take a fresh snapshot.');
  const digest = preparationDigest(plan);
  if (digest !== options.reviewedPlanSha256 || !options.reviewerId.trim()) throw new Error('Reviewed plan digest and reviewer are required.');
  const backupFile = await assertPreparationBackupPath(options.projectRoot, options.backupFile);
  const backup = z.strictObject({ planSha256: text, plan: planSchema }).parse(JSON.parse(await readFile(backupFile, 'utf8')));
  if (backup.planSha256 !== digest || preparationDigest(backup.plan) !== digest) throw new Error('Recovery backup does not match the reviewed plan.');
  return { plan, digest, changes: amendments(plan) };
};

export const applySourceTagRelease = async (client: SourceTagClient, rawPlan: unknown, options: SourceTagApproval) => {
  const { plan, digest, changes } = await approve(client, rawPlan, options);
  let transactionAttempted = false;
  let committing = false;
  try {
    transactionAttempted = true;
    await client.query('BEGIN ISOLATION LEVEL SERIALIZABLE');
    await client.query("SET LOCAL lock_timeout = '5s'");
    await client.query("SET LOCAL statement_timeout = '10s'");
    await client.query("SET LOCAL idle_in_transaction_session_timeout = '15s'");
    await client.query("SET LOCAL TIME ZONE 'UTC'");
    const database = await client.query('SELECT current_database() AS database');
    if (database.rows[0]?.['database'] !== plan.target.database) throw new Error('Connected database identity changed.');
    const reviewer = await client.query('SELECT id FROM "User" WHERE id = $1 AND role = $2 AND "isBanned" = false FOR SHARE', [options.reviewerId, Role.admin]);
    if (reviewer.rows.length !== 1) throw new Error('An active administrator must attribute the source-tag release.');
    const ids = plan.snapshots.map(snapshot => snapshot.id);
    const current = await readSourceTagSnapshots(client, ids, true);
    if (preparationDigest(current) !== preparationDigest(plan.snapshots)) throw new Error('Herb or source baseline changed; review a fresh snapshot.');
    for (const change of changes) {
      const updated = await client.query('UPDATE "HerbSource" SET supports = $1::text[] WHERE id = $2 AND "herbId" = $3 AND supports = $4::text[]',
        [change.proposedSupports, change.sourceId, change.herbId, change.sourceBefore.supports]);
      if (updated.rowCount !== 1) throw new Error('Expected exactly one additive source-tag update.');
    }
    const auditIds: number[] = [];
    for (const herbId of [...new Set(changes.map(change => change.herbId))]) {
      const result = await client.query('INSERT INTO "AuditLog" ("adminId", action, "targetType", "targetId", details) VALUES ($1, $2, $3, $4, $5::jsonb) RETURNING id',
        [options.reviewerId, 'UPDATE_HERB', 'Herb', herbId, JSON.stringify({ operation: 'PREPARATION_SOURCE_TAGS',
          changedFields: ['sourceSupports'], sourceIds: changes.filter(change => change.herbId === herbId).map(change => change.sourceId),
          planSha256: digest, embeddingRefreshed: false })]);
      auditIds.push(z.number().int().positive().parse(result.rows[0]?.['id']));
    }
    const expected = structuredClone(plan.snapshots);
    for (const snapshot of expected) for (const source of snapshot.sources) {
      const change = changes.find(entry => entry.herbId === snapshot.id && entry.sourceId === source.id);
      if (change) source.supports = change.proposedSupports;
    }
    if (preparationDigest(await readSourceTagSnapshots(client, ids, true)) !== preparationDigest(expected)) {
      throw new Error('Protected herb or source fields changed; refusing the release.');
    }
    committing = true;
    await client.query('COMMIT');
    return { status: 'SOURCE_TAGS_COMMITTED', sourceCount: changes.length, auditIds, planSha256: digest };
  } catch (error) {
    if (transactionAttempted) await rollbackSourceTagTransaction(client);
    if (committing) throw new SourceTagOutcomeUncertainError();
    throw error;
  }
};
