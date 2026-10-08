import { z } from "zod";

const text = z.string().trim().min(1);
const scientificName = text.regex(/^(?:× )?[A-Z][a-z]+ (?:× )?[a-z-]+(?: (?:subsp\.|var\.|f\.) [a-z-]+)?$/);
const sourceUrl = z.url().refine((value) => {
  const url = new URL(value);
  return url.protocol === "https:" && !url.username && !url.password;
}, "Use a public HTTPS source URL without credentials");

const candidateSchema = z.strictObject({
  id: text,
  batch: z.number().int().min(1).max(5),
  proposedLocalName: text,
  scientificName,
  acceptedTaxonKey: text,
  scientificSynonyms: z.array(scientificName),
  localAliases: z.array(text),
  book: z.strictObject({
    entry: z.number().int().positive(),
    heading: text,
    commonNames: text,
    printedPage: z.number().int().positive(),
    pdfPage: z.number().int().positive(),
  }),
  taxonomyUrl: sourceUrl,
  identityReview: z.literal("PENDING"),
  medicalReview: z.literal("PENDING"),
  safetyNote: text,
  photo: z.null(),
});

export const expansionQueueSchema = z.strictObject({
  schemaVersion: z.literal(1),
  batchId: text,
  preparedAt: z.iso.date(),
  status: z.literal("RESEARCH_QUEUE"),
  taxonomyChecklist: text,
  historicalSource: z.strictObject({ title: text, url: sourceUrl, pdfSha256: text.regex(/^[a-f0-9]{64}$/) }),
  selectionNote: text,
  candidates: z.array(candidateSchema).length(50),
}).superRefine((queue, context) => {
  for (const field of ["id", "scientificName", "acceptedTaxonKey", "book.entry"] as const) {
    const seen = new Set<string>();
    queue.candidates.forEach((candidate, index) => {
      const value = field === "book.entry" ? String(candidate.book.entry) : normalizeIdentity(candidate[field]);
      if (seen.has(value)) context.addIssue({ code: "custom", path: ["candidates", index], message: `Duplicate ${field}` });
      seen.add(value);
    });
  }
  for (let batch = 1; batch <= 5; batch += 1) {
    if (queue.candidates.filter((candidate) => candidate.batch === batch).length !== 10) {
      context.addIssue({ code: "custom", message: `Batch ${batch} must contain ten candidates` });
    }
  }
  const nameOwners = new Map<string, string>();
  queue.candidates.forEach((candidate, index) => {
    const identities = [
      ...[candidate.scientificName, ...candidate.scientificSynonyms].map((name) => `scientific:${canonicalScientificName(name)}`),
      ...[candidate.proposedLocalName, ...candidate.localAliases].map((name) => `local:${normalizeIdentity(name)}`),
    ];
    for (const identity of identities) {
      const owner = nameOwners.get(identity);
      if (owner && owner !== candidate.id) context.addIssue({ code: "custom", path: ["candidates", index], message: `Conflicting name or alias: ${identity}` });
      nameOwners.set(identity, candidate.id);
    }
  });
});

export type ExpansionQueue = z.infer<typeof expansionQueueSchema>;

export interface CatalogIdentity {
  id: string;
  localName: string;
  scientificName: string;
  sourceScientificName?: string | null;
  scientificSynonyms?: string[];
  localAliases?: string[];
  acceptedTaxonKey?: string;
}

export function normalizeIdentity(value: string): string {
  return value.normalize("NFKD").replace(/\p{M}/gu, "").trim().replace(/\s+/g, " ").toLowerCase().replace(/æ/g, "ae").replace(/œ/g, "oe");
}

export function canonicalScientificName(value: string): string {
  const normalized = normalizeIdentity(value);
  const binomial = normalized.match(/^(?:×\s*|x\s+)?([a-z]+) (?:×\s*|x\s+)?([a-z-]+)(?=\s|$)/);
  if (!binomial) return normalized;
  const remainder = normalized.slice(binomial[0].length);
  if (/×|\bx\b/.test(remainder)) return normalized;
  const rank = remainder.match(/(?:^|\s)(subsp\.|ssp\.|var\.|f\.)\s+([a-z-]+)(?=\s|$)/);
  if (!rank && /(?:^|\s)(?:subsp\.|ssp\.|var\.|f\.)/.test(remainder)) return normalized;
  const name = `${binomial[1]} ${binomial[2]}`;
  return rank ? `${name} ${rank[1] === "ssp." ? "subsp." : rank[1]} ${rank[2]}` : name;
}

export function findIdentityConflicts(queue: ExpansionQueue, catalog: CatalogIdentity[]) {
  return queue.candidates.flatMap((candidate) => {
    const scientificNames = new Set([candidate.scientificName, ...candidate.scientificSynonyms].map(canonicalScientificName));
    const localNames = new Set([candidate.proposedLocalName, ...candidate.localAliases].map(normalizeIdentity));
    return catalog.flatMap((record) => {
      const reasons: string[] = [];
      if (candidate.id === record.id) reasons.push("record ID");
      if (record.acceptedTaxonKey === candidate.acceptedTaxonKey) reasons.push("accepted taxon");
      const recordScientificNames = [record.scientificName, record.sourceScientificName, ...record.scientificSynonyms ?? []];
      if (recordScientificNames.some((name) => name && scientificNames.has(canonicalScientificName(name)))) reasons.push("scientific name or synonym");
      if ([record.localName, ...record.localAliases ?? []].some((name) => localNames.has(normalizeIdentity(name)))) reasons.push("local name or alias");
      return reasons.length ? [{ candidateId: candidate.id, recordId: record.id, reasons }] : [];
    });
  });
}

export function reviewExpansionQueue(input: unknown, publicCatalog: CatalogIdentity[] = []) {
  const queue = expansionQueueSchema.parse(input);
  const conflicts = findIdentityConflicts(queue, publicCatalog);
  return {
    batchId: queue.batchId,
    candidates: queue.candidates.length,
    batches: Array.from({ length: 5 }, (_, index) => ({ batch: index + 1, count: queue.candidates.filter((candidate) => candidate.batch === index + 1).length })),
    publicationAllowed: false as const,
    comparisonScope: "PUBLIC_BASELINE_ONLY" as const,
    conflicts,
    blockers: [
      "Compare all Neon Herb states and SuggestedHerb records, including reviewed synonyms and aliases, before staging; the public baseline is not a complete database check.",
      "Review each historical identity, local name, Philippine occurrence, modern evidence and plant-part-specific safety. Do not copy historical doses into current advice.",
      "Select and visually verify exact-species CC0 photos; retain creator, source and licence evidence internally before uploading to Cloudinary.",
      "Prepare cited field-level content and a separately reviewed staging/import plan; this research queue cannot be imported by the built-in herb importer.",
    ],
  };
}
