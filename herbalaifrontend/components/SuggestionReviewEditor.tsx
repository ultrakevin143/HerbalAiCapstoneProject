'use client';

import { useState, type FormEvent } from 'react';
import api from '../lib/axios';
import AccessibleDialog from './AccessibleDialog';

export interface ReviewReference {
  title: string;
  publisher: string;
  url: string;
  citation: string;
  publishedAt: string;
  supports: string[];
}

const fields = [
  ['localName', 'Local name'], ['scientificName', 'Scientific name'],
  ['cebuanoName', 'Other local names'], ['category', 'Category'],
  ['medicinalUses', 'Recorded uses'], ['preparationMethod', 'Preparation'],
  ['dosage', 'Dosage notes'], ['regionFound', 'Where it grows'],
  ['warnings', 'Safety notes'], ['informationSource', 'Contributor information source'],
  ['imageUrl', 'Image URL'],
] as const;
type Field = typeof fields[number][0];
const claims = [
  ['identity', 'Plant identity'], ['medicinalUses', 'Uses'],
  ['preparationMethod', 'Preparation'], ['dosage', 'Dosage'],
  ['warnings', 'Safety'], ['isDohApproved', 'Official listing'],
];
const blankReference = (): ReviewReference => ({ title: '', publisher: '', url: '', citation: '', publishedAt: '', supports: [] });

export type EditableSuggestion = { id: number; revision: number; references?: ReviewReference[]; reviewNotes?: string } & Partial<Record<Field, string>>;

export default function SuggestionReviewEditor({ suggestion, onSaved, onClose }: {
  suggestion: EditableSuggestion;
  onSaved: () => void;
  onClose: () => void;
}) {
  const [values, setValues] = useState(() => Object.fromEntries(fields.map(([key]) => [key, suggestion[key] || ''])) as Record<Field, string>);
  const [references, setReferences] = useState<ReviewReference[]>(suggestion.references?.length ? suggestion.references : [blankReference()]);
  const [notes, setNotes] = useState(suggestion.reviewNotes || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const updateReference = (index: number, update: Partial<ReviewReference>) => setReferences((current) => current.map((source, position) => position === index ? { ...source, ...update } : source));
  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (references.some((source) => !source.supports.length || !(source.url.trim() || source.citation.trim()))) {
      setError('Each reference needs a link or citation and at least one supported claim.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.patch(`/suggest/${suggestion.id}`, { ...values, references, reviewNotes: notes, revision: suggestion.revision });
      onSaved();
    } catch (failure: unknown) {
      const response = failure as { response?: { data?: { message?: string; errors?: { message: string }[] } } };
      setError(response.response?.data?.errors?.map((issue) => issue.message).join('; ') || response.response?.data?.message || 'Unable to save review.');
    } finally {
      setSaving(false);
    }
  };
  return <AccessibleDialog label="Edit submission and references" onClose={() => { if (!saving) onClose(); }}>
    <form onSubmit={save} className="bg-panel p-6 text-ink space-y-5">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">Edit submission & references</h2>
        <button type="button" disabled={saving} onClick={onClose} className="flat-button flat-button-secondary">Close</button>
      </div>
      <p>Save your corrections, then review the evidence classification before publishing.</p>
      {error && <p role="alert" className="text-error-ink">{error}</p>}
      <fieldset disabled={saving} className="grid gap-4 md:grid-cols-2">
        {fields.map(([key, label]) => <label key={key} className="grid gap-1">
          <span className="font-bold">{label}</span>
          <textarea rows={key === 'medicinalUses' || key === 'warnings' ? 4 : 2} className="flat-input" value={values[key]}
            required={['localName', 'scientificName', 'category', 'medicinalUses', 'preparationMethod', 'dosage', 'informationSource'].includes(key)}
            onChange={(event) => setValues((current) => ({ ...current, [key]: event.target.value }))} />
        </label>)}
      </fieldset>
      <h3 className="text-xl font-bold">References</h3>
      {references.map((source, index) => <fieldset disabled={saving} key={index} className="border border-line rounded-xl p-4 space-y-3">
        <legend className="font-bold">Reference {index + 1}</legend>
        {([['title', 'Title'], ['publisher', 'Publisher'], ['url', 'Link'], ['citation', 'Citation'], ['publishedAt', 'Publication year or date']] as const).map(([key, label]) =>
          <label key={key} className="grid gap-1">{label}<input className="flat-input" type={key === 'url' ? 'url' : 'text'} required={key === 'title'} value={source[key]} onChange={(event) => updateReference(index, { [key]: event.target.value })} /></label>)}
        <p className="font-bold">Which claims does this reference support?</p>
        <div className="flex flex-wrap gap-4">{claims.map(([key, label]) => <label key={key} className="flex gap-2 items-center">
          <input type="checkbox" checked={source.supports.includes(key)} onChange={(event) => updateReference(index, { supports: event.target.checked ? [...source.supports, key] : source.supports.filter((claim) => claim !== key) })} />{label}
        </label>)}</div>
        <button type="button" className="flat-button flat-button-secondary" disabled={references.length === 1} onClick={() => setReferences((current) => current.filter((_, position) => position !== index))}>Remove reference {index + 1}</button>
      </fieldset>)}
      <button type="button" disabled={saving || references.length >= 20} className="flat-button flat-button-secondary" onClick={() => setReferences((current) => [...current, blankReference()])}>Add reference</button>
      <label className="grid gap-1 font-bold">Review notes / reason for edits<textarea required maxLength={2000} disabled={saving} className="flat-input" rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
      <button disabled={saving} className="flat-button flat-button-primary" type="submit">{saving ? 'Saving…' : 'Save review edits'}</button>
    </form>
  </AccessibleDialog>;
}
