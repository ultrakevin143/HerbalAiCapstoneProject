import { readFile } from "node:fs/promises";
import path from "node:path";
import dotenv from "dotenv";
import { closeDatabasePool, prisma } from "../src/lib/prisma.js";
import { generateEmbedding } from "../src/services/ai/core/gemini-service.js";

dotenv.config();

type SourceDefinition = {
  title: string;
  publisher: string;
  url: string;
  reviewCoverage: string;
  retrievalNote?: string;
};

type Alias = {
  name: string;
  language: string;
  sourceIds: string[];
};

type DraftHerb = {
  id: string;
  slug: string;
  localName: string;
  scientificName: string;
  sourceScientificName: string | null;
  aliases: Alias[];
  proposedEvidenceClass: "EVIDENCE_SUPPORTED_PHILIPPINE_USE" | "DOCUMENTED_TRADITIONAL_USE";
  category: string;
  medicinalUses: string;
  preparationMethod: string;
  dosage: string;
  warnings: string;
  regionFound: string;
  fieldSources: Record<string, string[]>;
  evidenceReview: { sourceIds: string[]; summary: string; limitations: string };
  reviewGaps: string[];
  image: {
    path: string;
    creator: string;
    sourceUrl: string;
    license: string;
    licenseUrl: string;
    modification: string;
  };
};

type ResearchBatch = {
  preparedAt: string;
  status: string;
  sources: Record<string, SourceDefinition>;
  herbs: DraftHerb[];
};

const integrationSlugs = new Set(["luya", "luyang-dilaw", "malunggay", "sabila"]);

const hasFlag = (flag: string) => process.argv.includes(flag);

const argumentValue = (name: string) => {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
};

const sourceSupports = (herb: DraftHerb) => {
  const supports = new Map<string, Set<string>>();
  for (const [field, sourceIds] of Object.entries(herb.fieldSources)) {
    for (const sourceId of sourceIds) {
      const fields = supports.get(sourceId) ?? new Set<string>();
      fields.add(field);
      supports.set(sourceId, fields);
    }
  }
  for (const sourceId of herb.evidenceReview.sourceIds) {
    const fields = supports.get(sourceId) ?? new Set<string>();
    fields.add("evidenceReview");
    supports.set(sourceId, fields);
  }
  for (const alias of herb.aliases) {
    for (const sourceId of alias.sourceIds) {
      const fields = supports.get(sourceId) ?? new Set<string>();
      fields.add("localNames");
      supports.set(sourceId, fields);
    }
  }
  return supports;
};

const embeddingText = (herb: DraftHerb) => [
  herb.localName,
  ...herb.aliases.map(alias => alias.name),
  herb.scientificName,
  herb.sourceScientificName,
  herb.category,
  herb.proposedEvidenceClass,
  herb.medicinalUses,
  herb.preparationMethod,
  herb.dosage,
  herb.warnings,
].filter(Boolean).join(" ");

const main = async () => {
  const publish = hasFlag("--publish");
  const dryRun = hasFlag("--dry-run");
  const stage = hasFlag("--stage");
  const showStatus = hasFlag("--status");
  const reviewerId = argumentValue("--reviewer-id") ?? process.env["HERB_REVIEWER_ID"];
  const reviewerEmail = (process.env["HERB_REVIEWER_EMAIL"] ?? process.env["ADMIN_EMAIL"])?.trim().toLowerCase();
  const reviewerUsername = process.env["HERB_REVIEWER_USERNAME"]?.trim();
  if ([publish, dryRun, stage, showStatus].filter(Boolean).length !== 1) {
    throw new Error("Choose exactly one mode: --dry-run, --stage, --status, or --publish.");
  }
  const requestedFile = argumentValue("--file");
  const sourcePath = requestedFile
    ? path.resolve(process.cwd(), requestedFile)
    : new URL("../content/herbs/expansion-batch-01.json", import.meta.url);
  const batch = JSON.parse(await readFile(sourcePath, "utf8")) as ResearchBatch;
  const herbs = requestedFile ? batch.herbs : batch.herbs.filter(herb => integrationSlugs.has(herb.slug));

  if (batch.status !== "DRAFT" || herbs.length === 0 || (!requestedFile && herbs.length !== integrationSlugs.size)) {
    throw new Error("The selected built-in herb research batch is incomplete or no longer a draft.");
  }

  for (const herb of herbs) {
    if (herb.reviewGaps.length === 0) throw new Error(`${herb.localName} must retain its unresolved review gaps.`);
    for (const sourceId of sourceSupports(herb).keys()) {
      if (!batch.sources[sourceId]) throw new Error(`${herb.localName} references missing source ${sourceId}.`);
    }
  }

  if (dryRun) {
    console.log(`Validated ${herbs.length} staged built-in herbs: ${herbs.map(herb => herb.localName).join(", ")}`);
    return;
  }

  if (showStatus) {
    const records = await prisma.herb.findMany({
      where: { id: { in: herbs.map(herb => herb.id) } },
      select: { id: true, localName: true, publicationStatus: true, isVerified: true, reviewedById: true, _count: { select: { sources: true } } },
      orderBy: { localName: "asc" },
    });
    for (const record of records) {
      const [vectorStatus] = await prisma.$queryRawUnsafe<{ embedded: boolean }[]>(
        `SELECT embedding IS NOT NULL AS embedded FROM "Herb" WHERE id = $1`,
        record.id,
      );
      console.log(`${record.localName}: ${record.publicationStatus}, verified=${record.isVerified}, reviewer=${record.reviewedById ? "recorded" : "none"}, sources=${record._count.sources}, embedded=${vectorStatus?.embedded === true}`);
    }
    console.log(`Found ${records.length}/${herbs.length} integration candidates.`);
    return;
  }

  let reviewer: { id: string } | null = null;
  const embeddings = new Map<string, number[]>();
  if (publish) {
    if (!reviewerId && !reviewerEmail && !reviewerUsername) {
      throw new Error("Publishing requires an active administrator through reviewer ID, email, or username.");
    }
    reviewer = await prisma.user.findFirst({
      where: {
        role: "admin",
        isBanned: false,
        OR: [
          ...(reviewerId ? [{ id: reviewerId }] : []),
          ...(reviewerEmail ? [{ email: { equals: reviewerEmail, mode: "insensitive" as const } }] : []),
          ...(reviewerUsername ? [{ username: { equals: reviewerUsername, mode: "insensitive" as const } }] : []),
        ],
      },
      select: { id: true },
    });
    if (!reviewer) throw new Error("The supplied reviewer must be an active administrator.");
    for (const herb of herbs) embeddings.set(herb.id, await generateEmbedding(embeddingText(herb)));
  }

  await prisma.$transaction(async tx => {
    for (const herb of herbs) {
      const existingById = await tx.herb.findUnique({ where: { id: herb.id } });
      if (existingById && existingById.provenance !== "BUILT_IN") {
        throw new Error(`${herb.id} belongs to ${existingById.provenance}; refusing to overwrite it.`);
      }
      const conflictingRecord = await tx.herb.findFirst({
        where: {
          id: { not: herb.id },
          OR: [
            { localName: { equals: herb.localName, mode: "insensitive" } },
            { scientificName: { equals: herb.scientificName, mode: "insensitive" } },
          ],
        },
        select: { id: true, localName: true, provenance: true },
      });
      if (conflictingRecord) {
        throw new Error(`Conflict for ${herb.localName}: existing ${conflictingRecord.provenance} record ${conflictingRecord.id}.`);
      }
      if (stage && existingById?.publicationStatus === "PUBLISHED") {
        console.log(`Skipped published built-in herb: ${herb.localName}`);
        continue;
      }

      const sources = sourceSupports(herb);
      const herbData = {
        localName: herb.localName,
        cebuanoName: null,
        scientificName: herb.scientificName,
        sourceScientificName: herb.sourceScientificName,
        category: herb.category,
        medicinalUses: herb.medicinalUses,
        preparationMethod: herb.preparationMethod,
        dosage: herb.dosage,
        regionFound: herb.regionFound,
        warnings: herb.warnings,
        imageUrl: herb.image.path,
        imageCreator: herb.image.creator,
        imageSourceUrl: herb.image.sourceUrl,
        imageLicense: herb.image.license,
        imageLicenseUrl: herb.image.licenseUrl,
        imageModification: herb.image.modification,
        isDohApproved: false,
        isVerified: publish,
        publicationStatus: publish ? "PUBLISHED" as const : "DRAFT" as const,
        evidenceClass: publish ? herb.proposedEvidenceClass : "UNASSESSED" as const,
        provenance: "BUILT_IN" as const,
        reviewedAt: publish ? new Date() : null,
        reviewedById: reviewer?.id ?? null,
      };
      await tx.herb.upsert({ where: { id: herb.id }, create: { id: herb.id, ...herbData }, update: herbData });
      await tx.herbSource.deleteMany({ where: { herbId: herb.id } });
      await tx.herbSource.createMany({
        data: [...sources].map(([sourceId, fields]) => {
          const source = batch.sources[sourceId]!;
          return {
            herbId: herb.id,
            title: source.title,
            publisher: source.publisher,
            url: source.url,
            citation: source.retrievalNote ?? `Review coverage: ${source.reviewCoverage}.`,
            supports: [...fields].sort(),
            accessedAt: new Date(`${batch.preparedAt}T00:00:00.000Z`),
          };
        }),
      });
      const vector = embeddings.get(herb.id);
      if (publish && vector) {
        await tx.$executeRawUnsafe(
          `UPDATE "Herb" SET embedding = $1::vector, "updatedAt" = NOW() WHERE id = $2`,
          `[${vector.join(",")}]`,
          herb.id,
        );
      } else {
        await tx.$executeRawUnsafe(`UPDATE "Herb" SET embedding = NULL WHERE id = $1`, herb.id);
      }
    }
  }, { maxWait: 20_000, timeout: Math.max(30_000, herbs.length * 6_000) });

  console.log(`${publish ? "Published" : "Staged"} ${herbs.length} built-in herbs: ${herbs.map(herb => herb.localName).join(", ")}`);
};

main()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDatabasePool();
  });
