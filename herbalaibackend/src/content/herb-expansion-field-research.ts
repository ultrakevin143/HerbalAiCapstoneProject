import { z } from 'zod';
import { occurrenceResearchSchema, reviewFirstTenOccurrenceResearch } from './herb-expansion-occurrence-research.js';

const text = z.string().trim().min(1);
const publicUrl = z.url().refine(value => {
  const url = new URL(value);
  return url.protocol === 'https:' && !url.username && !url.password;
});
const sourceSchema = z.object({ id: text, kind: text, title: text, url: publicUrl, limitation: text });
const identitySchema = z.object({ candidateId: text, localName: text, scientificName: text, bookEntry: z.number().int().positive(), printedPage: z.number().int().positive() });
const preparationSchema = identitySchema.extend({
  preparationPart: text, preparationKind: z.enum(['FOOD_DESCRIPTION', 'PREPARATION_METHOD_NOT_ESTABLISHED']),
  preparationDescription: text, preparationSourceIds: z.array(text).min(1), safetySourceIds: z.array(text),
  preparationInstructions: z.null(), dosage: z.null(), publicationAllowed: z.literal(false),
});
const heldLedger = z.object({ queueId: text, publicationAllowed: z.literal(false), stagingAllowed: z.literal(false) });
const researchSchema = z.object({
  occurrence: occurrenceResearchSchema.optional(),
  preparations: heldLedger.extend({ status: z.literal('PREPARATION_SUPPLEMENT_NOT_IMPORTABLE'),
    sources: z.array(sourceSchema).min(1), records: z.array(preparationSchema).length(10) }),
  preparationOverlay: heldLedger.extend({ status: z.literal('RESEARCH_ONLY_NOT_IMPORTABLE'), productionWritesPerformed: z.literal(false),
    sources: z.array(sourceSchema).min(1), proposal: identitySchema.extend({
      candidateId: z.literal('research-pardo-094'), scientificName: z.literal('Terminalia catappa'),
      preparationPart: text, preparationKind: z.literal('FOOD_DESCRIPTION'), proposedPreparationMethod: text,
      preparationSourceIds: z.array(text).min(1), preparationInstructions: z.null(), dosage: z.null(),
      householdRecipeEstablished: z.literal(false), medicinalInstructionsCleared: z.literal(false), publicationAllowed: z.literal(false),
    }) }),
  safetyOverlay: heldLedger.extend({ status: z.literal('RESEARCH_ONLY_NOT_IMPORTABLE'), productionWritesPerformed: z.literal(false),
    sources: z.array(sourceSchema.extend({ scientificName: z.literal('Terminalia catappa'), plantPart: z.literal('STEM_BARK'),
      studyPopulation: z.literal('RATS'), supports: z.array(z.enum(['warnings', 'evidenceReview'])).min(1) })).min(1),
    proposal: identitySchema.extend({ candidateId: z.literal('research-pardo-094'), scientificName: z.literal('Terminalia catappa'),
      proposedWarnings: text, proposedModernEvidenceNote: text, safetySourceIds: z.array(text).min(1),
      humanSafetyCleared: z.literal(false), medicinalInstructionsCleared: z.literal(false), dosage: z.null(),
      publicationAllowed: z.literal(false), publicationBlockers: z.array(text).min(1),
    }) }),
});

export interface FieldResearchSource {
  id: string;
  kind: string;
  title: string;
  url: string;
  limitation: string;
  supports: string[];
}

const sourceMap = (sources: z.infer<typeof sourceSchema>[]) => {
  const result = new Map(sources.map(source => [source.id, source]));
  if (result.size !== sources.length) throw new Error('Duplicate field-research source definition');
  return result;
};

export function reviewFirstTenFieldResearch(input: unknown, queueId: string, identities: z.infer<typeof identitySchema>[]) {
  const research = researchSchema.parse(input);
  for (const ledger of [research.preparations, research.preparationOverlay, research.safetyOverlay]) {
    if (ledger.queueId !== queueId) throw new Error('Field research belongs to another research queue');
  }
  const identityMap = new Map(identities.map(record => [record.candidateId, record]));
  const records = new Map(research.preparations.records.map(record => [record.candidateId, record]));
  if (identityMap.size !== 10 || records.size !== 10 || [...records.keys()].some(candidateId => !identityMap.has(candidateId))) {
    throw new Error('Field research must cover exactly the first ten candidates');
  }
  const assertIdentity = (record: z.infer<typeof identitySchema>) => {
    const expected = identityMap.get(record.candidateId);
    if (!expected || record.localName !== expected.localName || record.scientificName !== expected.scientificName
      || record.bookEntry !== expected.bookEntry || record.printedPage !== expected.printedPage) {
      throw new Error(`Field research identity mismatch for ${record.candidateId}`);
    }
  };
  const preparationSources = sourceMap(research.preparations.sources);
  const overlaySources = sourceMap(research.preparationOverlay.sources);
  sourceMap(research.safetyOverlay.sources);
  assertIdentity(research.preparationOverlay.proposal);
  assertIdentity(research.safetyOverlay.proposal);
  const occurrences = research.occurrence ? reviewFirstTenOccurrenceResearch(research.occurrence, queueId, identities) : undefined;
  const results = new Map<string, {
    preparationMethod: string; preparationPart: string; proposedSources: FieldResearchSource[];
    warnings?: string; modernEvidenceNote?: string; reviewGaps: string[];
    regionFound?: string; geographicScope?: 'COUNTRY_ONLY' | 'SPECIFIC_LOCALITY' | 'STUDY_AREA';
  }>();
  for (const record of records.values()) {
    assertIdentity(record);
    const usesOverlay = record.candidateId === research.preparationOverlay.proposal.candidateId;
    const preparation = usesOverlay ? research.preparationOverlay.proposal : record;
    if (preparation.preparationKind !== 'FOOD_DESCRIPTION') throw new Error('Unresolved food preparation in field research');
    const proposedSources: FieldResearchSource[] = [];
    const addSources = (ids: string[], lookup: Map<string, z.infer<typeof sourceSchema>>, supports: string[]) => {
      for (const sourceId of ids) {
        const source = lookup.get(sourceId);
        if (!source) throw new Error(`Missing field-research source ${sourceId}`);
        proposedSources.push({ ...source, supports });
      }
    };
    addSources(preparation.preparationSourceIds, usesOverlay ? overlaySources : preparationSources, ['preparationMethod']);
    addSources(record.safetySourceIds, preparationSources, ['warnings']);
    const safety = record.candidateId === research.safetyOverlay.proposal.candidateId ? research.safetyOverlay.proposal : undefined;
    if (safety) {
      const safetySources = new Map(research.safetyOverlay.sources.map(source => [source.id, source]));
      for (const sourceId of safety.safetySourceIds) {
        const source = safetySources.get(sourceId);
        if (!source || !source.supports.includes('warnings') || !source.supports.includes('evidenceReview')) {
          throw new Error('Bark safety evidence must explicitly support its warning and evidence-review limits');
        }
      }
      addSources(safety.safetySourceIds, safetySources, ['warnings', 'evidenceReview', 'medicinalUses']);
    }
    const occurrence = occurrences?.get(record.candidateId);
    proposedSources.push(...(occurrence?.proposedSources ?? []));
    results.set(record.candidateId, {
      preparationMethod: 'proposedPreparationMethod' in preparation ? preparation.proposedPreparationMethod : preparation.preparationDescription,
      preparationPart: preparation.preparationPart, proposedSources,
      ...(safety ? { warnings: safety.proposedWarnings, modernEvidenceNote: safety.proposedModernEvidenceNote } : {}),
      ...(occurrence ? { regionFound: occurrence.regionFound, geographicScope: occurrence.geographicScope } : {}),
      reviewGaps: ['Food descriptions are not complete medicinal household recipes or validated treatment doses.', ...(safety?.publicationBlockers ?? []),
        ...(occurrence ? [] : ['Occurrence/region field has not been reviewed for this draft.'])],
    });
  }
  return results;
}

export function mergeFieldResearchSources(existing: FieldResearchSource[], additions: FieldResearchSource[]): FieldResearchSource[] {
  const result: FieldResearchSource[] = [];
  const sourceUrls = new Map<string, string>();
  const byUrl = new Map<string, FieldResearchSource>();
  const limitations = new Map<string, Set<string>>();
  for (const source of [...existing, ...additions]) {
    const previousUrl = sourceUrls.get(source.id);
    if (previousUrl && previousUrl !== source.url) throw new Error('A field-research source ID cannot override an existing URL');
    sourceUrls.set(source.id, source.url);
    const urlMatch = byUrl.get(source.url);
    if (urlMatch) {
      urlMatch.supports = [...new Set([...urlMatch.supports, ...source.supports])];
      const notes = limitations.get(source.url)!;
      notes.add(source.limitation);
      urlMatch.limitation = [...notes].join(' ');
    } else {
      const record = { ...source, supports: [...new Set(source.supports)] };
      result.push(record);
      byUrl.set(source.url, record);
      limitations.set(source.url, new Set([source.limitation]));
    }
  }
  return result;
}
