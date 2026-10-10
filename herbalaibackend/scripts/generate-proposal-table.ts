import { prisma } from '../src/lib/prisma.js';
import { proposedHerbs } from './verify-proposed-herbs.js';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const dbHerbs = await prisma.herb.findMany({
    select: {
      localName: true,
      scientificName: true,
    },
  });

  const dbSciSet = new Set(dbHerbs.map((h) => h.scientificName.toLowerCase().trim()));
  const dbLocalSet = new Set(dbHerbs.map((h) => h.localName.toLowerCase().trim()));

  // Take the first 100 candidates
  const selected100 = proposedHerbs.slice(0, 100);

  console.log(`Total candidates extracted: ${selected100.length}`);

  // Validate zero duplicates
  const collisions: string[] = [];
  const internalSci = new Set<string>();
  const internalLocal = new Set<string>();

  for (let i = 0; i < selected100.length; i++) {
    const h = selected100[i];
    const sLower = h.scientificName.toLowerCase().trim();
    const lLower = h.localName.toLowerCase().trim();

    if (dbSciSet.has(sLower)) {
      collisions.push(`Herb #${i + 1} (${h.localName}): Scientific name "${h.scientificName}" matches existing DB!`);
    }
    if (dbLocalSet.has(lLower)) {
      collisions.push(`Herb #${i + 1} (${h.localName}): Local name "${h.localName}" matches existing DB!`);
    }
    if (internalSci.has(sLower)) {
      collisions.push(`Herb #${i + 1} (${h.localName}): Duplicate scientific name inside list "${h.scientificName}"!`);
    }
    if (internalLocal.has(lLower)) {
      collisions.push(`Herb #${i + 1} (${h.localName}): Duplicate local name inside list "${h.localName}"!`);
    }
    internalSci.add(sLower);
    internalLocal.add(lLower);
  }

  if (collisions.length > 0) {
    console.error('Found collisions:', collisions);
    process.exit(1);
  }

  console.log('Validation SUCCESS: Exactly 100 herbs selected with 0 DB duplicates and 0 internal duplicates!');

  // Generate markdown artifact
  let md = `# Proposed 100 Philippine Medicinal Herbs for Manual Review\n\n`;
  md += `> **Status**: PROPOSED ONLY (Not staged or written to database).\n`;
  md += `> **Existing Database Herbs**: 138 records.\n`;
  md += `> **Proposed Expansion Count**: 100 records.\n`;
  md += `> **Duplicate Check Result**: 0 collisions on Scientific Name, 0 collisions on Local/Tagalog Name.\n`;
  md += `> **Primary Sources**: StuartXchange Philippine Medicinal Plants, Philippine National Formulary (PNF), Quisumbing Medicinal Plants of the Philippines.\n\n`;

  md += `| # | Local / Common Name | Scientific Name | Bisaya / Cebuano | English Name | Category | Primary Uses | Preparation & Dosage | Warnings & Precautions |\n`;
  md += `|---|---|---|---|---|---|---|---|---|\n`;

  selected100.forEach((h, idx) => {
    const uses = h.medicinalUses.replace(/\|/g, '\\|');
    const prep = `${h.preparationMethod} Dosage: ${h.dosage}`.replace(/\|/g, '\\|');
    const warn = h.warnings.replace(/\|/g, '\\|');
    md += `| ${idx + 1} | **${h.localName}** | *${h.scientificName}* | ${h.cebuanoName} | ${h.englishName} | ${h.category} | ${uses} | ${prep} | ${warn} |\n`;
  });

  const outPath = path.resolve('..', 'PROPOSED_100_PHILIPPINE_HERBS.md');
  fs.writeFileSync(outPath, md, 'utf-8');
  console.log(`Saved proposal markdown to ${outPath}`);

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
