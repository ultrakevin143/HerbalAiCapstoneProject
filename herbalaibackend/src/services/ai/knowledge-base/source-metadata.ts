export const hasPhilippineSourceMetadata = (metadata: unknown): boolean => {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return false;
  const record = metadata as Record<string, unknown>;
  if (typeof record['jurisdiction'] !== 'string' || record['jurisdiction'].trim().toLowerCase() !== 'philippines') return false;

  const sources = record['sources'];
  return Array.isArray(sources) && sources.length > 0 && sources.every((source) => {
    if (!source || typeof source !== 'object' || Array.isArray(source)) return false;
    const entry = source as Record<string, unknown>;
    if (typeof entry['title'] !== 'string' || !entry['title'].trim()
      || typeof entry['publisher'] !== 'string' || !entry['publisher'].trim()
      || typeof entry['url'] !== 'string' || !URL.canParse(entry['url'])) return false;
    return ['http:', 'https:'].includes(new URL(entry['url']).protocol);
  });
};
