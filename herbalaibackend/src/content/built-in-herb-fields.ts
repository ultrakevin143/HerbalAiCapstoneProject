interface EmbeddableHerb {
  localName: string;
  aliases: Array<{ name: string }>;
  scientificName: string;
  sourceScientificName: string | null;
  category: string;
  proposedEvidenceClass: string;
  medicinalUses: string;
  preparationMethod: string;
  dosage: string;
  warnings: string;
}

export const builtInHerbEmbeddingText = (herb: EmbeddableHerb) => [
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
].filter(Boolean).join(' ');

export const herbSourceAccessedAt = (source: { accessedAt?: string }, preparedAt: string) => {
  const dateText = source.accessedAt ?? preparedAt;
  const date = new Date(`${dateText}T00:00:00.000Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateText) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== dateText) {
    throw new Error('Herb source access date must be a valid YYYY-MM-DD date.');
  }
  return date;
};
