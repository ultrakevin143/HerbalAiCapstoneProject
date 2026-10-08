import { writeFile } from 'node:fs/promises';
import type { PoolClient } from 'pg';
import { z } from 'zod';
import { assertPreparationTarget, preparationDigest } from './herb-preparation-update.js';
import { canonicalScientificName, normalizeIdentity } from './herb-expansion-review.js';
import { expansionIdentitySql } from './herb-expansion-draft-import.js';

export const educationalDoseBoundary = 'This educational entry supplies no medicinal dose or treatment regimen. Its preparation description is not a prescribed home-treatment recipe.';
const text = z.string().trim().min(1);
const id = text.regex(/^builtin-expansion-03-pardo-\d{3}$/);
const source = z.object({ id: z.number().int(), herbId: id, title: text, url: z.url(), supports: z.array(text) }).passthrough();
const snapshot = z.object({ id, localName: text, scientificName: text, category: text, medicinalUses: text,
  preparationMethod: text, dosage: text, warnings: text, regionFound: text, imageUrl: z.url(),
  imageSourceUrl: z.url(), imageLicense: z.literal('CC0 1.0'), imageLicenseUrl: z.url(),
  publicationStatus: z.literal('DRAFT'), evidenceClass: z.literal('UNASSESSED'),
  isVerified: z.literal(false), isDohApproved: z.literal(false), reviewedAt: z.null(), reviewedById: z.null(), embedding: z.null(),
}).passthrough();
export const educationalReleaseSchema = z.strictObject({
  status: z.literal('SOURCE_LIMITED_EDUCATIONAL_RELEASE'), target: z.strictObject({ host: text, database: text }),
  preparedAt: z.iso.datetime(), clinicalValidation: z.literal(false), medicinalInstructionsCleared: z.literal(false),
  records: z.array(z.strictObject({ before: snapshot, sources: z.array(source).min(2),
    category: z.literal('Food-use descriptions'), dosage: z.literal(educationalDoseBoundary),
    identityEvidenceFile: text, mediaEvidenceFile: text, reviewNote: text,
    identityAliases: z.strictObject({ scientificSynonyms: z.array(text), localAliases: z.array(text) }),
    acceptedIdentityChecked: z.literal(true), sourceLimitedFoodDescriptionChecked: z.literal(true),
    freshPhotoCheck: z.strictObject({ checkedAt: z.iso.datetime(), scientificName: text, observationId: z.number().int().positive(),
      photoId: z.number().int().positive(), taxon: text, rank: z.literal('species'), quality: z.literal('research'),
      license: z.literal('cc0'), passed: z.literal(true), candidateId: text }),
  })).min(1).max(10),
});

export function validateEducationalRelease(raw: unknown, now = new Date()) {
  const plan = educationalReleaseSchema.parse(raw);
  const age = now.getTime() - Date.parse(plan.preparedAt);
  if (age < 0 || age > 3_600_000) throw new Error('Educational release snapshot expired.');
  if (new Set(plan.records.map(row => row.before.id)).size !== plan.records.length) throw new Error('Duplicate release record.');
  for (const row of plan.records) {
    const photo = row.freshPhotoCheck;
    const photoAge = now.getTime() - Date.parse(photo.checkedAt);
    if (photoAge < 0 || photoAge > 3_600_000 || photo.taxon !== row.before.scientificName
      || photo.scientificName !== row.before.scientificName
      || row.before.imageSourceUrl !== `https://www.inaturalist.org/observations/${photo.observationId}`
      || !row.before.imageUrl.startsWith('https://res.cloudinary.com/dclqw6at7/image/upload/')) {
      throw new Error('Current cover identity, licence or delivery ownership mismatch.');
    }
    if (row.sources.some(reference => reference.herbId !== row.before.id)
      || new Set(row.sources.map(reference => reference.id)).size !== row.sources.length) throw new Error('Source ownership mismatch.');
    const covered = new Set(row.sources.flatMap(reference => reference.supports));
    if (!['identity', 'medicinalUses', 'preparationMethod', 'warnings', 'regionFound'].every(field => covered.has(field))) {
      throw new Error('Missing field-specific educational sources.');
    }
    if (!/culinary|food|kernel/i.test(row.before.preparationMethod)
      || !/not treatment|not a|not establish|no .*recipe/i.test(row.before.preparationMethod)) {
      throw new Error('Only explicitly bounded food-use descriptions are permitted.');
    }
  }
  return plan;
}

export async function releaseEducationalDrafts(client: PoolClient, raw: unknown, options: {
  connectionUrl: string; reviewedPlanSha256: string; backupFile: string; reviewerId: string;
}) {
  const plan = validateEducationalRelease(raw);
  assertPreparationTarget(options.connectionUrl, plan.target);
  if (preparationDigest(plan) !== options.reviewedPlanSha256 || !options.backupFile || !options.reviewerId) {
    throw new Error('Reviewed digest, backup and authorized administrator are required.');
  }
  const ids = plan.records.map(row => row.before.id);
  await client.query('BEGIN');
  try {
    await client.query("SET LOCAL lock_timeout = '5s'");
    await client.query("SET LOCAL statement_timeout = '20s'");
    await client.query('LOCK TABLE "Herb", "HerbSource", "SuggestedHerb" IN SHARE ROW EXCLUSIVE MODE');
    const target = (await client.query('SELECT current_database() AS database')).rows[0];
    if (target.database !== plan.target.database) throw new Error('Wrong release database.');
    const admin = await client.query('SELECT id FROM "User" WHERE id = $1 AND role = $2 AND "isBanned" = false FOR SHARE', [options.reviewerId, 'admin']);
    if (admin.rowCount !== 1) throw new Error('Active authorized administrator required.');
    const actual = (await client.query('SELECT to_jsonb(herb) AS herb FROM "Herb" herb WHERE id = ANY($1::text[]) ORDER BY id', [ids])).rows.map(row => row.herb);
    const references = (await client.query('SELECT to_jsonb(source) AS source FROM "HerbSource" source WHERE "herbId" = ANY($1::text[]) ORDER BY id', [ids])).rows.map(row => row.source);
    if (actual.length !== ids.length || plan.records.some(row => preparationDigest(actual.find(herb => herb.id === row.before.id)) !== preparationDigest(row.before)
      || preparationDigest(references.filter(source => source.herbId === row.before.id)) !== preparationDigest(row.sources))) {
      throw new Error('Draft or source changed since review; nothing published.');
    }
    const identities = (await client.query(expansionIdentitySql)).rows.filter(row => !ids.some(id => row.id === `Herb:${id}`));
    for (const row of plan.records) {
      const scientific = new Set([row.before.scientificName, row.before.sourceScientificName,
        ...row.identityAliases.scientificSynonyms].filter((value): value is string => typeof value === 'string').map(canonicalScientificName));
      const local = new Set([row.before.localName, ...row.identityAliases.localAliases].map(normalizeIdentity));
      if (identities.some(identity => [identity.scientificName, identity.sourceScientificName].some(value => value && scientific.has(canonicalScientificName(value)))
        || [identity.localName, ...(identity.cebuanoName ?? '').split(/\s*[,;/|]\s*/).filter(Boolean)].some(value => local.has(normalizeIdentity(value))))) {
        throw new Error('Conflicting all-state scientific identity or local alias.');
      }
    }
    await writeFile(options.backupFile, JSON.stringify({ status: 'EDUCATIONAL_RELEASE_BACKUP', capturedAt: new Date().toISOString(),
      target: plan.target, planSha256: options.reviewedPlanSha256, records: actual, sources: references }, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
    const changed = await client.query(`WITH changes AS (SELECT * FROM jsonb_to_recordset($1::jsonb) AS change(id text, category text, dosage text))
      UPDATE "Herb" herb SET category = changes.category, dosage = changes.dosage, "publicationStatus" = 'PUBLISHED',
        "evidenceClass" = 'DOCUMENTED_TRADITIONAL_USE', "isVerified" = true, "reviewedAt" = NOW(), "reviewedById" = $2, "updatedAt" = NOW()
      FROM changes WHERE herb.id = changes.id AND herb."publicationStatus" = 'DRAFT' AND herb."isVerified" = false AND herb.embedding IS NULL RETURNING herb.id`,
    [JSON.stringify(plan.records.map(row => ({ id: row.before.id, category: row.category, dosage: row.dosage }))), options.reviewerId]);
    if (changed.rowCount !== ids.length) throw new Error('Publication compare-and-swap failed.');
    await client.query(`INSERT INTO "AuditLog" ("adminId", action, "targetType", "targetId", details, "createdAt")
      SELECT $1, 'PUBLISH_EDUCATIONAL_HERB', 'Herb', record->'before'->>'id', jsonb_build_object(
        'planSha256', $3::text, 'reviewType', 'AUTOMATED_SOURCE_LIMITED_EDITORIAL_REVIEW', 'clinicalValidation', false,
        'medicinalInstructionsCleared', false, 'dosePolicy', 'NO_MEDICINAL_DOSE_SUPPLIED', 'reviewNote', record->>'reviewNote',
        'identityEvidenceFile', record->>'identityEvidenceFile', 'mediaEvidenceFile', record->>'mediaEvidenceFile'), NOW()
      FROM jsonb_array_elements($2::jsonb) record`, [options.reviewerId, JSON.stringify(plan.records), options.reviewedPlanSha256]);
    await client.query('COMMIT');
    return { published: changed.rowCount, clinicalValidation: false, embeddingsGenerated: 0 };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}
