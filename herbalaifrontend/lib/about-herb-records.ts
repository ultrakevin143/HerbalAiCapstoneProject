import type { HerbSource } from '../components/HerbReferences';

export interface AboutHerb {
  id: string;
  name: string;
  scientificName: string;
  englishName: string;
  indications: string[];
  preparation: string;
  safetyNotes: string;
  image: string;
  sources: HerbSource[];
}

const displayOrder = ['Lagundi', 'Sambong', 'Ampalaya', 'Bayabas', 'Bawang', 'Tsaang Gubat', 'Yerba Buena', 'Niyog-niyogan', 'Ulasimang Bato', 'Akapulko'];
const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const text = (value: unknown): string => typeof value === 'string' ? value.trim() : '';

const isSource = (value: unknown): value is HerbSource => isObject(value)
  && Number.isSafeInteger(value.id) && Boolean(text(value.title))
  && Array.isArray(value.supports) && value.supports.every((claim) => typeof claim === 'string')
  && ['publisher', 'url', 'citation', 'publishedAt'].every((field) => value[field] == null || typeof value[field] === 'string');

export function aboutHerbRecords(payload: unknown): AboutHerb[] {
  if (!isObject(payload) || payload.status !== 'success' || !isObject(payload.data) || !Array.isArray(payload.data.herbs)) return [];
  const records = payload.data.herbs.filter((value): value is Record<string, unknown> => isObject(value)
    && value.isDohApproved === true && value.publicationStatus === 'PUBLISHED'
    && ['id', 'localName', 'scientificName', 'medicinalUses', 'preparationMethod', 'dosage'].every((field) => Boolean(text(value[field]))));

  return displayOrder.flatMap((name) => {
    const record = records.find((value) => text(value.localName).toLowerCase() === name.toLowerCase());
    if (!record) return [];
    return [{
      id: text(record.id),
      name: text(record.localName),
      scientificName: text(record.scientificName),
      englishName: text(record.cebuanoName) || text(record.category),
      indications: [text(record.medicinalUses)],
      preparation: `${text(record.preparationMethod)} Dosage notes: ${text(record.dosage)}`,
      safetyNotes: text(record.warnings) || 'No safety notes are attached to this record. A listed plant is not a guarantee of effectiveness or safety.',
      image: text(record.imageUrl),
      sources: Array.isArray(record.sources) ? record.sources.filter(isSource) : [],
    }];
  });
}
