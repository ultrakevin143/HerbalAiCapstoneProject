import { writeFile } from 'node:fs/promises';
import type { PoolClient } from 'pg';
import { z } from 'zod';
import { expansionQueueSchema, findIdentityConflicts } from './herb-expansion-review.js';
import { assertPreparationTarget, preparationDigest } from './herb-preparation-update.js';

const text = z.string().trim().min(1);
const publicUrl = z.url().refine(value => {
  const url = new URL(value);
  return url.protocol === 'https:' && !url.username && !url.password;
});
const targetSchema = z.strictObject({ host: text, database: text });
const dataSchema = z.object({
  id: text.regex(/^builtin-expansion-03-pardo-\d{3}$/), localName: text, scientificName: text,
  sourceScientificName: text.nullable().optional(), category: text, medicinalUses: text,
  preparationMethod: text, dosage: text, warnings: text, regionFound: text.nullable().optional(),
  imageUrl: publicUrl.refine(value => new URL(value).hostname === 'res.cloudinary.com'
    && new URL(value).pathname.startsWith('/dclqw6at7/image/upload/')).optional(),
  imageSourceUrl: publicUrl.optional(), imageLicense: text.optional(), imageLicenseUrl: publicUrl.optional(),
  imageCreator: text.nullable().optional(), imageModification: text.optional(),
  publicationStatus: z.literal('DRAFT'), evidenceClass: z.literal('UNASSESSED'), provenance: z.literal('BUILT_IN'),
  isVerified: z.literal(false), isDohApproved: z.literal(false), reviewedAt: z.null(), reviewedById: z.null(), embedding: z.null(),
});
const sourceSchema = z.object({
  id: text, title: text, url: publicUrl, supports: z.array(text).min(1),
  publisher: text.nullable().optional(), limitation: text.optional(), kind: text.optional(),
});
const rowSchema = z.object({
  candidateId: text, reviewGaps: z.array(text).min(1), uncitedFields: z.array(text),
  proposedData: dataSchema, proposedSources: z.array(sourceSchema).min(1),
});
const heldPlanSchema = z.object({
  queueId: text, status: z.literal('DRAFT_PLAN_NOT_EXECUTABLE'), writeAllowed: z.literal(false),
  publicationAllowed: z.literal(false), draftRows: z.array(rowSchema).min(1).max(50),
});
const importPlanSchema = z.strictObject({
  status: z.literal('DRAFT_IMPORT_REVIEW_REQUIRED'), target: targetSchema,
  queue: expansionQueueSchema, rows: z.array(rowSchema).length(50),
  publicationAllowed: z.literal(false), embeddingsAllowed: z.literal(false), existingRecordUpdatesAllowed: z.literal(false),
});
export type ExpansionDraftImportPlan = z.infer<typeof importPlanSchema>;

export function buildExpansionDraftImportPlan(queueInput: unknown, planInputs: unknown[], targetInput: unknown): ExpansionDraftImportPlan {
  const queue = expansionQueueSchema.parse(queueInput);
  const plans = planInputs.map(value => heldPlanSchema.parse(value));
  if (plans.some(plan => plan.queueId !== queue.batchId)) throw new Error('Draft import queue mismatch.');
  const plan = importPlanSchema.parse({ status: 'DRAFT_IMPORT_REVIEW_REQUIRED', target: targetInput,
    queue, rows: plans.flatMap(value => value.draftRows), publicationAllowed: false,
    embeddingsAllowed: false, existingRecordUpdatesAllowed: false });
  validateRows(plan);
  return plan;
}

function validateRows(plan: ExpansionDraftImportPlan) {
  for (const values of [plan.rows.map(row => row.candidateId), plan.rows.map(row => row.proposedData.id)]) {
    if (new Set(values).size !== values.length) throw new Error('Duplicate draft import ownership.');
  }
  for (const row of plan.rows) {
    const candidate = plan.queue.candidates.find(value => value.id === row.candidateId);
    if (!candidate || candidate.proposedLocalName !== row.proposedData.localName
      || candidate.scientificName !== row.proposedData.scientificName
      || row.proposedData.id !== `builtin-expansion-03-pardo-${String(candidate.book.entry).padStart(3, '0')}`) {
      throw new Error('Draft import identity mismatch.');
    }
    if (new Set(row.proposedSources.map(source => source.id)).size !== row.proposedSources.length) {
      throw new Error('Duplicate draft source ownership.');
    }
    if (!row.proposedData.imageUrl && ['imageSourceUrl', 'imageLicense', 'imageLicenseUrl', 'imageCreator', 'imageModification']
      .some(field => row.proposedData[field as keyof typeof row.proposedData] !== undefined)) {
      throw new Error('Draft image provenance has no selected image.');
    }
  }
}

const herbColumns = ['id', 'localName', 'scientificName', 'sourceScientificName', 'category', 'medicinalUses',
  'preparationMethod', 'dosage', 'warnings', 'regionFound', 'imageUrl', 'imageSourceUrl', 'imageLicense',
  'imageLicenseUrl', 'imageCreator', 'imageModification', 'publicationStatus', 'evidenceClass', 'provenance',
  'isVerified', 'isDohApproved', 'reviewedAt', 'reviewedById'];

export const expansionIdentitySql = `SELECT 'Herb:' || id AS id, "localName", "scientificName", "sourceScientificName", "cebuanoName" FROM "Herb"
  UNION ALL SELECT 'SuggestedHerb:' || id::text, "localName", "scientificName", NULL, "cebuanoName" FROM "SuggestedHerb"`;
export const expansionIdentitySnapshotSql = `SELECT COALESCE(jsonb_agg(to_jsonb(identity_row) ORDER BY identity_row.id), '[]'::jsonb) AS identities
  FROM (${expansionIdentitySql}) identity_row`;
const identitySnapshotSchema = z.strictObject({
  target: targetSchema, capturedAt: z.iso.datetime(),
  identities: z.array(z.strictObject({ id: text, localName: text, scientificName: text,
    sourceScientificName: z.string().nullable(), cebuanoName: z.string().nullable() })),
});
const sqlValue = (value: string) => {
  const tag = `herbalai_${preparationDigest(value)}`;
  if (value.includes(`$${tag}$`)) throw new Error('Unsafe SQL value delimiter.');
  return `$${tag}$${value}$${tag}$`;
};

export function buildExpansionDraftStageSql(rawPlan: unknown, rawSnapshot: unknown, reviewerId: string, now = new Date()) {
  const plan = importPlanSchema.parse(rawPlan);
  const snapshot = identitySnapshotSchema.parse(rawSnapshot);
  validateRows(plan);
  const age = now.getTime() - Date.parse(snapshot.capturedAt);
  if (!Number.isFinite(age) || age < 0 || age > 3_600_000
    || preparationDigest(snapshot.target) !== preparationDigest(plan.target)) throw new Error('Draft import identity snapshot is stale or targets another database.');
  if (new Set(snapshot.identities.map(row => row.id)).size !== snapshot.identities.length) throw new Error('Duplicate identity snapshot rows.');
  const conflicts = findIdentityConflicts(plan.queue, snapshot.identities.map(row => ({ ...row,
    localAliases: (row.cebuanoName ?? '').split(/\s*[,;/|]\s*/).filter(Boolean) })));
  if (conflicts.length || snapshot.identities.some(row => plan.rows.some(draft => `Herb:${draft.proposedData.id}` === row.id))) {
    throw new Error('Draft import conflicts with the captured all-state catalog.');
  }
  const identities = [...snapshot.identities].sort((left, right) => left.id < right.id ? -1 : left.id > right.id ? 1 : 0);
  const columns = herbColumns.map(column => `"${column}"`).join(', ');
  const guardTag = `herbalai_guard_${preparationDigest({ plan, identities, reviewerId })}`;
  if ([JSON.stringify(plan), JSON.stringify(identities), reviewerId].some(value => value.includes(`$${guardTag}$`))) {
    throw new Error('Unsafe SQL guard delimiter.');
  }
  return `BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
LOCK TABLE "Herb", "SuggestedHerb" IN SHARE ROW EXCLUSIVE MODE;
DO $${guardTag}$
DECLARE
  plan jsonb := ${sqlValue(JSON.stringify(plan))}::jsonb;
  expected_identities jsonb := ${sqlValue(JSON.stringify(identities))}::jsonb;
  current_identities jsonb;
  draft jsonb;
  source jsonb;
  reviewer text := ${sqlValue(text.parse(reviewerId))};
BEGIN
  IF current_database() <> plan->'target'->>'database' THEN RAISE EXCEPTION 'Wrong import database'; END IF;
  IF clock_timestamp() < ${sqlValue(snapshot.capturedAt)}::timestamptz
    OR clock_timestamp() - ${sqlValue(snapshot.capturedAt)}::timestamptz > INTERVAL '1 hour' THEN
    RAISE EXCEPTION 'Draft import identity snapshot expired; capture a fresh snapshot';
  END IF;
  PERFORM id FROM "User" WHERE id = reviewer AND role = 'admin' AND "isBanned" = false FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Active administrator required'; END IF;
  ${expansionIdentitySnapshotSql.replace(' AS identities', '').replace('FROM (', 'INTO current_identities FROM (')};
  IF current_identities IS DISTINCT FROM expected_identities THEN RAISE EXCEPTION 'All-state identity snapshot changed; import aborted'; END IF;
  FOR draft IN SELECT jsonb_array_elements(plan->'rows') LOOP
    INSERT INTO "Herb" (${columns}, "createdAt", "updatedAt")
      SELECT ${herbColumns.map(column => `data."${column}"`).join(', ')}, NOW(), NOW()
      FROM jsonb_populate_record(NULL::"Herb", draft->'proposedData') data;
    FOR source IN SELECT jsonb_array_elements(draft->'proposedSources') LOOP
      INSERT INTO "HerbSource" ("herbId", title, publisher, url, citation, supports, "createdAt")
        VALUES (draft->'proposedData'->>'id', source->>'title', source->>'publisher', source->>'url',
          COALESCE(source->>'limitation', source->>'kind'), ARRAY(SELECT jsonb_array_elements_text(source->'supports')), NOW());
    END LOOP;
    INSERT INTO "AuditLog" ("adminId", action, "targetType", "targetId", details, "createdAt")
      VALUES (reviewer, 'STAGE_HERB_DRAFT', 'Herb', draft->'proposedData'->>'id', jsonb_build_object(
        'queueId', plan->'queue'->>'batchId', 'candidateId', draft->>'candidateId',
        'planSha256', ${sqlValue(preparationDigest(plan))}, 'reviewGaps', draft->'reviewGaps',
        'uncitedFields', draft->'uncitedFields', 'publicationAllowed', false,
        'sourceIds', (SELECT jsonb_agg(value->'id') FROM jsonb_array_elements(draft->'proposedSources'))), NOW());
  END LOOP;
END $${guardTag}$;
COMMIT;
SELECT COUNT(*)::int AS staged_drafts, COUNT(*) FILTER (WHERE "isVerified" OR "publicationStatus" <> 'DRAFT')::int AS unexpectedly_published,
  COUNT(*) FILTER (WHERE embedding IS NOT NULL)::int AS unexpectedly_embedded
  FROM "Herb" WHERE id IN (SELECT jsonb_array_elements_text(${sqlValue(JSON.stringify(plan.rows.map(row => row.proposedData.id)))}::jsonb));
`;
}

export async function stageExpansionDrafts(client: PoolClient, rawPlan: unknown, options: {
  connectionUrl: string; independentlyConfirmedTarget: unknown; reviewedPlanSha256: string;
  backupFile: string; reviewerId: string;
}) {
  const plan = importPlanSchema.parse(rawPlan);
  validateRows(plan);
  assertPreparationTarget(options.connectionUrl, options.independentlyConfirmedTarget);
  const target = targetSchema.parse(options.independentlyConfirmedTarget);
  if (preparationDigest(target) !== preparationDigest(plan.target)
    || options.reviewedPlanSha256 !== preparationDigest(plan)) throw new Error('Draft import target or reviewed digest changed.');
  if (!options.backupFile || !options.reviewerId) throw new Error('Draft staging requires a private backup and active administrator.');
  await client.query('BEGIN');
  try {
    await client.query("SET LOCAL lock_timeout = '5s'");
    await client.query("SET LOCAL statement_timeout = '15s'");
    await client.query('LOCK TABLE "Herb", "SuggestedHerb" IN SHARE ROW EXCLUSIVE MODE');
    const database = await client.query<{ database: string }>('SELECT current_database() AS database');
    if (database.rows[0]?.database !== plan.target.database) throw new Error('Connected server database differs from reviewed target.');
    const reviewer = await client.query('SELECT id FROM "User" WHERE id = $1 AND role = $2 AND "isBanned" = false FOR SHARE',
      [options.reviewerId, 'admin']);
    if (reviewer.rowCount !== 1) throw new Error('Draft staging requires an active administrator.');
    const identities = await client.query<{ id: string; localName: string; scientificName: string;
      sourceScientificName: string | null; cebuanoName: string | null }>(
      expansionIdentitySql);
    const existingIds = await client.query<{ id: string }>('SELECT id FROM "Herb" WHERE id = ANY($1::text[])',
      [plan.rows.map(row => row.proposedData.id)]);
    const conflicts = findIdentityConflicts(plan.queue, identities.rows.map(row => ({ ...row,
      localAliases: (row.cebuanoName ?? '').split(/\s*[,;/|]\s*/).filter(Boolean) })));
    if (existingIds.rowCount || conflicts.length) throw new Error('Draft import conflicts with an existing herb or suggestion; nothing was inserted.');
    await writeFile(options.backupFile, JSON.stringify({ status: 'INSERT_ONLY_DRAFT_IMPORT_BACKUP', target,
      planSha256: options.reviewedPlanSha256, capturedAt: new Date().toISOString(), before: [],
      plannedIds: plan.rows.map(row => row.proposedData.id), identitySnapshot: identities.rows }, null, 2) + '\n',
    { flag: 'wx', mode: 0o600 });
    const columns = herbColumns.map(column => `"${column}"`).join(', ');
    for (const row of plan.rows) {
      await client.query(`INSERT INTO "Herb" (${columns}, "createdAt", "updatedAt")
        SELECT ${herbColumns.map(column => `data."${column}"`).join(', ')}, NOW(), NOW()
        FROM jsonb_populate_record(NULL::"Herb", $1::jsonb) data`, [JSON.stringify(row.proposedData)]);
      for (const source of row.proposedSources) {
        await client.query(`INSERT INTO "HerbSource" ("herbId", title, publisher, url, citation, supports, "createdAt")
          VALUES ($1, $2, $3, $4, $5, $6::text[], NOW())`, [row.proposedData.id, source.title,
          source.publisher ?? null, source.url, source.limitation ?? source.kind ?? null, source.supports]);
      }
      await client.query(`INSERT INTO "AuditLog" ("adminId", action, "targetType", "targetId", details, "createdAt")
        VALUES ($1, 'STAGE_HERB_DRAFT', 'Herb', $2, $3::jsonb, NOW())`, [options.reviewerId, row.proposedData.id,
        JSON.stringify({ queueId: plan.queue.batchId, candidateId: row.candidateId,
          planSha256: options.reviewedPlanSha256, reviewGaps: row.reviewGaps, uncitedFields: row.uncitedFields,
          publicationAllowed: false, sourceIds: row.proposedSources.map(source => source.id) })]);
    }
    await client.query('COMMIT');
    return { staged: plan.rows.length, published: 0, existingRecordsUpdated: 0, embeddingsGenerated: 0 };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}
