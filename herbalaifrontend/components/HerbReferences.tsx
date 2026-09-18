export interface HerbSource {
  id: number;
  title: string;
  publisher?: string | null;
  url?: string | null;
  citation?: string | null;
  supports: string[];
  publishedAt?: string | null;
}

const fieldLabels: Record<string, string> = {
  medicinalUses: 'Uses',
  preparationMethod: 'Preparation',
  dosage: 'Dosage',
  warnings: 'Safety',
  humanEvidence: 'Human research',
  preclinicalEvidence: 'Laboratory / animal research',
  traditionalUse: 'Traditional use',
  limitations: 'Study limitations',
  scientificName: 'Plant identity',
  sourceScientificName: 'Scientific synonym',
  localName: 'Local name',
  cebuanoName: 'Regional names',
  regionFound: 'Distribution',
  isDohApproved: 'Official listing',
  evidenceClass: 'Evidence classification',
};

function referenceUrl(value?: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

export default function HerbReferences({ sources = [] }: { sources?: HerbSource[] }) {
  return (
    <details className="rounded-xl border border-line bg-soft p-5">
      <summary className="cursor-pointer font-semibold rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4">
        Sources & references ({sources.length})
      </summary>
      <p className="mt-3 text-muted">References support specific statements, not every use of this plant. A study is not a guarantee of effectiveness or safety.</p>
      {sources.length ? (
        <ul className="mt-4 space-y-5">
          {sources.map(source => {
            const href = referenceUrl(source.url);
            const labels = [...new Set(source.supports.map(field => fieldLabels[field]).filter(Boolean))];
            return (
              <li key={source.id} className="border-t border-line pt-4 break-words">
                {href ? (
                  <a href={href} target="_blank" rel="noopener noreferrer" className="font-medium underline underline-offset-4">
                    {source.title}<span className="sr-only"> (opens in a new tab)</span>
                  </a>
                ) : <p className="font-medium">{source.title}</p>}
                {(source.publisher || source.publishedAt) && <p className="mt-1 text-sm text-muted">{[source.publisher, source.publishedAt].filter(Boolean).join(' · ')}</p>}
                {source.citation && <p className="mt-1 text-sm text-muted">{source.citation}</p>}
                {labels.length > 0 && <p className="mt-2 text-sm text-muted">Supports: {labels.join(', ')}</p>}
              </li>
            );
          })}
        </ul>
      ) : <p className="mt-3 text-muted">No references are attached to this entry yet. Its claims cannot be independently checked from this page.</p>}
    </details>
  );
}
