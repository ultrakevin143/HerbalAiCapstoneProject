import * as fs from 'fs';
import * as path from 'path';
import { proposedHerbs } from './verify-proposed-herbs.js';

function normalizeKey(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function generateEntries(): Record<string, any> {
  const selected100 = proposedHerbs.slice(0, 100);
  const registry: Record<string, any> = {};

  for (const h of selected100) {
    const key = normalizeKey(h.localName);
    const ceb = h.cebuanoName || h.localName;
    const stuartSlug = h.localName.replace(/[^a-zA-Z0-9]/g, '');
    registry[key] = {
      canonicalLocalName: h.localName,
      scientificName: h.scientificName,
      english: h.englishName,
      tagalog: h.localName,
      cebuano: ceb,
      ilocano: h.localName,
      bikol: h.localName,
      hiligaynon: ceb,
      stuartUrl: `https://www.stuartxchange.org/${stuartSlug}.html`,
    };
  }

  return registry;
}

function updateFile(filePath: string, newEntries: Record<string, any>) {
  console.log(`Updating ${filePath}...`);
  let content = fs.readFileSync(filePath, 'utf-8');

  // Find where REGIONAL_HERB_REGISTRY = { starts
  const startMarker = 'export const REGIONAL_HERB_REGISTRY: Record<string, RegionalHerbInfo> = {';
  const startIndex = content.indexOf(startMarker);
  if (startIndex === -1) {
    throw new Error(`Could not find start marker in ${filePath}`);
  }

  // Find the closing brace of the object (before normalizeKey)
  const normKeyPattern = /};\r?\n\r?\n\/\*\*\r?\n \* Normalizes an herb name/;
  const match = content.match(normKeyPattern);
  if (!match || match.index === undefined) {
    throw new Error(`Could not find closing brace of REGIONAL_HERB_REGISTRY in ${filePath}`);
  }
  const closeIndex = match.index;

  // Format new JSON entries to append
  let appendedEntries = '';
  for (const [key, val] of Object.entries(newEntries)) {
    // Only add if not already in content
    if (!content.includes(`"${val.canonicalLocalName}"`)) {
      appendedEntries += `  "${key}": ${JSON.stringify(val, null, 4).replace(/\n/g, '\n  ')},\n`;
    }
  }

  if (!appendedEntries) {
    console.log(`All entries already present in ${filePath}`);
    return;
  }

  // Check if preceding entry ended with a comma
  const beforeText = content.slice(0, closeIndex);
  const trimmedBefore = beforeText.trimEnd();
  let prefix = '';
  if (!trimmedBefore.endsWith(',')) {
    // We need to add comma after the last closing brace
    const lastBraceIndex = beforeText.lastIndexOf('}');
    if (lastBraceIndex !== -1) {
      content = content.slice(0, lastBraceIndex + 1) + ',' + content.slice(lastBraceIndex + 1);
      // Re-find closeIndex
      const newMatch = content.match(normKeyPattern);
      const newCloseIndex = newMatch!.index!;
      const updatedContent = content.slice(0, newCloseIndex) + appendedEntries + content.slice(newCloseIndex);
      fs.writeFileSync(filePath, updatedContent, 'utf-8');
      console.log(`Successfully appended new entries to ${filePath}`);
      return;
    }
  }

  const updatedContent = content.slice(0, closeIndex) + appendedEntries + content.slice(closeIndex);
  fs.writeFileSync(filePath, updatedContent, 'utf-8');
  console.log(`Successfully appended new entries to ${filePath}`);
}

async function main() {
  const newEntries = generateEntries();
  const backendPath = path.resolve('src', 'content', 'regionalCommonNames.ts');
  const frontendPath = path.resolve('..', 'herbalaifrontend', 'lib', 'regionalCommonNames.ts');

  updateFile(backendPath, newEntries);
  updateFile(frontendPath, newEntries);
  console.log('✅ Regional common names registries updated in both backend and frontend!');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
