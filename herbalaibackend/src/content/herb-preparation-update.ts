import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import type { PoolClient } from 'pg';
import { z } from 'zod';
import { herbSourceAccessedAt } from './built-in-herb-fields.js';

export const genericPreparation = 'No clinically validated home preparation is provided in this entry.';
const changedFields = ['preparationMethod', 'dosage', 'warnings'] as const;
const text = z.string().trim().min(1);
const storedText = z.string().min(1).refine(value => value.trim().length > 0);
const sourceSchema = z.looseObject({ id: z.number().int(), herbId: storedText, title: storedText, supports: z.array(z.string()) });
const snapshotSchema = z.looseObject({
  id: storedText.regex(/^builtin-/), localName: storedText, scientificName: storedText, provenance: z.literal('BUILT_IN'),
  publicationStatus: z.literal('PUBLISHED'), isVerified: z.literal(true),
  preparationMethod: storedText, dosage: storedText, warnings: z.string().nullable(),
  updatedAt: storedText, embedding: z.string().nullable(), sources: z.array(sourceSchema),
});
const targetSchema = z.strictObject({ host: text, database: text });
const batchSchema = z.object({
  status: z.literal('DRAFT'), preparedAt: text,
  sources: z.record(z.string(), z.object({
    title: text, publisher: text, url: z.url(), retrievalNote: text, accessedAt: text.optional(),
  })),
  herbs: z.array(z.object({
    id: text.regex(/^builtin-/), localName: text, scientificName: text,
    preparationMethod: text, dosage: text, warnings: text,
    fieldSources: z.record(z.string(), z.array(text)), reviewGaps: z.array(text).min(1),
  })).min(1).max(20),
});
const additionSchema = z.strictObject({
  herbId: text, title: text, publisher: text, url: z.url(), citation: text,
  supports: z.array(z.enum(changedFields)).min(1), accessedAt: z.iso.datetime(),
});
const changesSchema = z.strictObject({ preparationMethod: text, dosage: text.optional(), warnings: text.optional() });
export const preparationPlanSchema = z.strictObject({
  status: z.literal('REVIEW_REQUIRED_EXISTING_RECORD_UPDATE'), target: targetSchema,
  preparedAt: z.iso.datetime(), batchSha256: text.regex(/^[a-f0-9]{64}$/),
  records: z.array(z.strictObject({
    before: snapshotSchema, beforeSha256: text.regex(/^[a-f0-9]{64}$/), changes: changesSchema,
    sourceAdditions: z.array(additionSchema).min(1), retainedReviewGaps: z.array(text).min(1),
  })).min(1).max(20),
});
export type PreparationPlan = z.infer<typeof preparationPlanSchema>;
type Snapshot = z.infer<typeof snapshotSchema>;

const canonicalJson = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    const fields = Object.entries(value).sort(([left], [right]) => left.localeCompare(right));
    return `{${fields.map(([key, entry]) => `${JSON.stringify(key)}:${canonicalJson(entry)}`).join(',')}}`;
  }
  const encoded = JSON.stringify(value);
  if (encoded === undefined) throw new Error('Snapshot contains an unserializable value.');
  return encoded;
};
export const preparationDigest = (value: unknown): string => createHash('sha256').update(canonicalJson(value)).digest('hex');

const normalizeSnapshot = (raw: unknown): Snapshot => {
  const snapshot = snapshotSchema.parse(raw);
  snapshot.sources.sort((left, right) => left.id - right.id);
  if (new Set(snapshot.sources.map(source => source.id)).size !== snapshot.sources.length
    || snapshot.sources.some(source => source.herbId !== snapshot.id)) {
    throw new Error('Snapshot sources do not belong exclusively to this record.');
  }
  return snapshot;
};

export const validatePreparationConnectionUrl = (connectionUrl: string): URL => {
  let connection: URL;
  try { connection = new URL(connectionUrl); } catch { throw new Error('Invalid database connection configuration.'); }
  if (!['postgres:', 'postgresql:'].includes(connection.protocol) || !connection.hostname || connection.pathname.length <= 1 || connection.hash) {
    throw new Error('Invalid preparation database connection configuration.');
  }
  const permitted = new Set(['sslmode', 'channel_binding', 'uselibpqcompat']);
  const seen = new Set<string>();
  for (const [parameter] of connection.searchParams) {
    if (!permitted.has(parameter) || seen.has(parameter)) {
      throw new Error('Preparation connection parameters must not override the confirmed target or execution settings.');
    }
    seen.add(parameter);
  }
  return connection;
};

export const assertPreparationTarget = (connectionUrl: string, rawTarget: unknown): void => {
  const target = targetSchema.parse(rawTarget);
  const connection = validatePreparationConnectionUrl(connectionUrl);
  const host = connection.hostname.replace('-pooler.', '.');
  if (host !== target.host.replace('-pooler.', '.')
    || decodeURIComponent(connection.pathname.slice(1)) !== target.database) {
    throw new Error('Database target does not match the independently confirmed preparation target.');
  }
};

export const buildPreparationPlan = (rawBatch: unknown, rawSnapshots: unknown[], rawTarget: unknown, now = new Date()): PreparationPlan => {
  const batch = batchSchema.parse(rawBatch);
  const target = targetSchema.parse(rawTarget);
  const snapshots = rawSnapshots.map(normalizeSnapshot);
  const ids = batch.herbs.map(herb => herb.id);
  if (new Set(ids).size !== ids.length || new Set(snapshots.map(snapshot => snapshot.id)).size !== snapshots.length
    || snapshots.length !== ids.length || snapshots.some(snapshot => !ids.includes(snapshot.id))) {
    throw new Error('Preparation plans require exactly the selected existing identities, without duplicates or additions.');
  }
  const records = batch.herbs.map(herb => {
    const before = snapshots.find(snapshot => snapshot.id === herb.id)!;
    if (before.localName !== herb.localName || before.scientificName !== herb.scientificName
      || before.preparationMethod !== genericPreparation || herb.preparationMethod === genericPreparation) {
      throw new Error(`Preparation baseline or exact identity changed for ${herb.id}; review it again.`);
    }
    const preparationSources = herb.fieldSources['preparationMethod'];
    if (!preparationSources?.length) throw new Error(`Preparation citations are missing for ${herb.id}.`);
    const changes: z.infer<typeof changesSchema> = { preparationMethod: herb.preparationMethod };
    for (const field of ['dosage', 'warnings'] as const) {
      if (herb[field] !== before[field] && herb.fieldSources[field]?.length) changes[field] = herb[field];
    }
    const supportBySource = new Map<string, Set<typeof changedFields[number]>>();
    for (const field of changedFields.filter(field => changes[field] !== undefined)) {
      for (const sourceId of herb.fieldSources[field] ?? []) {
        const support = supportBySource.get(sourceId) ?? new Set<typeof changedFields[number]>();
        support.add(field);
        supportBySource.set(sourceId, support);
      }
    }
    const sourceAdditions = [...supportBySource].map(([sourceId, support]) => {
      const source = batch.sources[sourceId];
      if (!source) throw new Error(`Unknown preparation source ${sourceId}.`);
      const url = new URL(source.url);
      if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Preparation citations must be public HTTPS URLs.');
      return { herbId: herb.id, title: source.title, publisher: source.publisher, url: source.url,
        citation: source.retrievalNote, supports: [...support].sort(),
        accessedAt: herbSourceAccessedAt(source.accessedAt ? { accessedAt: source.accessedAt } : {}, batch.preparedAt).toISOString() };
    });
    return { before, beforeSha256: preparationDigest(before), changes, sourceAdditions, retainedReviewGaps: herb.reviewGaps };
  });
  return preparationPlanSchema.parse({ status: 'REVIEW_REQUIRED_EXISTING_RECORD_UPDATE', target,
    preparedAt: now.toISOString(), batchSha256: preparationDigest(rawBatch), records });
};

export const preparationEmbeddingText = (record: PreparationPlan['records'][number]): string => {
  const updated: Record<string, unknown> = { ...record.before, ...record.changes };
  return ['localName', 'cebuanoName', 'scientificName', 'sourceScientificName', 'category', 'evidenceClass',
    'medicinalUses', 'preparationMethod', 'dosage', 'warnings'].map(field => updated[field]).filter(value => typeof value === 'string' && value.trim()).join(' ');
};

export const writePreparationBackup = async (plan: PreparationPlan, filename: string): Promise<void> => {
  const checked = preparationPlanSchema.parse(plan);
  await writeFile(filename, JSON.stringify({ planSha256: preparationDigest(checked), plan: checked }, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
};

export const readPreparationSnapshots = async (client: PoolClient, ids: string[], lock = false): Promise<unknown[]> => {
  const herbs = await client.query<{ document: Record<string, unknown> }>(
    `SELECT to_jsonb(herb) || jsonb_build_object('embedding', herb.embedding::text) AS document
     FROM "Herb" herb WHERE herb.id = ANY($1::text[]) ORDER BY herb.id${lock ? ' FOR UPDATE OF herb' : ''}`, [ids]);
  const sources = await client.query<{ document: Record<string, unknown> }>(
    `SELECT to_jsonb(source) AS document FROM "HerbSource" source WHERE source."herbId" = ANY($1::text[]) ORDER BY source.id${lock ? ' FOR UPDATE OF source' : ''}`, [ids]);
  return herbs.rows.map(row => ({ ...row.document, sources: sources.rows.filter(source => source.document['herbId'] === row.document['id']).map(source => source.document) }));
};

export interface PreparationApprovalOptions {
  connectionUrl: string; independentlyConfirmedTarget: unknown; reviewedPlanSha256: string;
  backupFile: string; reviewerId: string; now?: Date;
}

export const readApprovedPreparationPlan = async (rawPlan: unknown, options: PreparationApprovalOptions): Promise<PreparationPlan> => {
  const plan = preparationPlanSchema.parse(rawPlan);
  assertPreparationTarget(options.connectionUrl, options.independentlyConfirmedTarget);
  if (canonicalJson(plan.target) !== canonicalJson(targetSchema.parse(options.independentlyConfirmedTarget))) throw new Error('Plan target changed.');
  const now = options.now ?? new Date();
  const age = now.getTime() - Date.parse(plan.preparedAt);
  if (!Number.isFinite(age) || age < 0 || age > 15 * 60_000) throw new Error('Preparation plan is stale; take a fresh snapshot.');
  const digest = preparationDigest(plan);
  if (digest !== options.reviewedPlanSha256) throw new Error('Preparation plan differs from the reviewed plan.');
  const backup = JSON.parse(await readFile(options.backupFile, 'utf8')) as { planSha256?: unknown; plan?: unknown };
  if (backup.planSha256 !== digest || preparationDigest(backup.plan) !== digest) throw new Error('Recovery backup does not match the reviewed plan.');
  if (!options.reviewerId.trim()) throw new Error('Preparation reviewer is missing.');
  return plan;
};

export const applyPreparationPlan = async (client: PoolClient, rawPlan: unknown, vectors: Map<string, number[]>, options: PreparationApprovalOptions): Promise<{ updated: number; insertedSourceIds: number[] }> => {
  const plan = await readApprovedPreparationPlan(rawPlan, options);
  const digest = preparationDigest(plan);
  const ids = plan.records.map(record => record.before.id);
  if (new Set(ids).size !== ids.length || vectors.size !== ids.length || !options.reviewerId.trim()) throw new Error('Reviewer, identities or embedding coverage is incomplete.');
  for (const record of plan.records) {
    if (record.before.preparationMethod !== genericPreparation || record.changes.preparationMethod === genericPreparation
      || preparationDigest(normalizeSnapshot(record.before)) !== record.beforeSha256
      || record.sourceAdditions.some(source => source.herbId !== record.before.id)) throw new Error('Preparation plan baseline is invalid.');
    for (const field of changedFields.filter(field => record.changes[field] !== undefined)) {
      if (!record.sourceAdditions.some(source => source.supports.includes(field))) throw new Error('A changed field has no reviewed source attribution.');
    }
    for (const source of record.sourceAdditions) {
      const url = new URL(source.url);
      if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Preparation citations must be public HTTPS URLs.');
    }
    const vector = vectors.get(record.before.id);
    if (!vector || vector.length !== 768 || vector.some(value => !Number.isFinite(value)) || vector.every(value => value === 0)) {
      throw new Error('Every reviewed current-field embedding must contain 768 finite, nonzero-vector values.');
    }
  }
  const insertedSourceIds: number[] = [];
  await client.query('BEGIN ISOLATION LEVEL SERIALIZABLE');
  try {
    await client.query("SET LOCAL lock_timeout = '5s'");
    await client.query("SET LOCAL statement_timeout = '10s'");
    const reviewer = await client.query('SELECT id FROM "User" WHERE id = $1 AND role = $2 AND "isBanned" = false FOR SHARE', [options.reviewerId, 'admin']);
    if (reviewer.rowCount !== 1) throw new Error('Preparation reviewer is not an active administrator.');
    const current = (await readPreparationSnapshots(client, ids, true)).map(normalizeSnapshot);
    if (current.length !== ids.length) throw new Error('A selected existing record is missing.');
    for (const record of plan.records) {
      const snapshot = current.find(entry => entry.id === record.before.id);
      if (!snapshot || preparationDigest(snapshot) !== record.beforeSha256) throw new Error('Concurrent content or source change; preparation update rolled back.');
    }
    for (const record of plan.records) {
      const fields = changedFields.filter(field => record.changes[field] !== undefined);
      const parameters: unknown[] = fields.map(field => record.changes[field]);
      parameters.push(`[${vectors.get(record.before.id)!.join(',')}]`, record.before.id);
      const updated = await client.query(`UPDATE "Herb" SET ${fields.map((field, index) => `"${field}" = $${index + 1}`).join(', ')},
        embedding = $${fields.length + 1}::vector, "updatedAt" = NOW() WHERE id = $${fields.length + 2}`, parameters);
      if (updated.rowCount !== 1) throw new Error('Existing preparation update did not affect exactly one record.');
      for (const source of record.sourceAdditions) {
        const inserted = await client.query<{ id: number }>(`INSERT INTO "HerbSource" ("herbId", title, publisher, url, citation, supports, "accessedAt", "createdAt")
          SELECT $1, $2, $3, $4, $5, $6::text[], $7::timestamptz, NOW()
          WHERE NOT EXISTS (SELECT 1 FROM "HerbSource" WHERE "herbId" = $1 AND title = $2 AND publisher IS NOT DISTINCT FROM $3
            AND url IS NOT DISTINCT FROM $4 AND citation IS NOT DISTINCT FROM $5 AND supports @> $6::text[] AND "accessedAt" IS NOT DISTINCT FROM $7::timestamptz)
          RETURNING id`, [source.herbId, source.title, source.publisher, source.url, source.citation, source.supports, source.accessedAt]);
        insertedSourceIds.push(...inserted.rows.map(row => row.id));
      }
      await client.query(`INSERT INTO "AuditLog" ("adminId", action, "targetType", "targetId", details, "createdAt") VALUES ($1, $2, $3, $4, $5::jsonb, NOW())`,
        [options.reviewerId, 'UPDATE_HERB', 'Herb', record.before.id, JSON.stringify({ operation: 'PREPARATION_ENRICHMENT', planSha256: digest, beforeSha256: record.beforeSha256, changedFields: fields, embeddingRefreshed: true })]);
    }
    await client.query('COMMIT');
    return { updated: plan.records.length, insertedSourceIds };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
};
