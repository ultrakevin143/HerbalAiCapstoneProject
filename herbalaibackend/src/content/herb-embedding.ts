export const herbEmbeddingFields = ['localName', 'cebuanoName', 'scientificName', 'sourceScientificName', 'category', 'evidenceClass', 'medicinalUses', 'preparationMethod', 'dosage', 'warnings'] as const;

export const herbEmbeddingText = (herb: Record<string, unknown>): string =>
  herbEmbeddingFields.map(field => herb[field]).filter(value => typeof value === 'string' && value.trim()).join(' ');
