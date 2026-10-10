import { prisma } from '../src/lib/prisma.js';
import { REGIONAL_HERB_REGISTRY } from '../src/content/regionalCommonNames.js';
import { proposedHerbs } from './verify-proposed-herbs.js';

async function check() {
  const selected100 = proposedHerbs.slice(0, 100);
  const dbHerbs = await prisma.herb.findMany();
  
  const dbSci = new Set(dbHerbs.map((h) => h.scientificName.toLowerCase().trim()));
  const dbLocal = new Set(dbHerbs.map((h) => h.localName.toLowerCase().trim()));
  
  const regSci = new Set<string>();
  const regCanon = new Set<string>();
  const regAllNames = new Set<string>();
  
  for (const [, v] of Object.entries(REGIONAL_HERB_REGISTRY)) {
    regSci.add(v.scientificName.toLowerCase().trim());
    regCanon.add(v.canonicalLocalName.toLowerCase().trim());
    [v.tagalog, v.cebuano, v.ilocano, v.bikol, v.hiligaynon, v.english].forEach((str) => {
      if (str) {
        str.split(',').forEach((part) => regAllNames.add(part.toLowerCase().trim()));
      }
    });
  }

  console.log(`DB count: ${dbHerbs.length}, Registry count: ${Object.keys(REGIONAL_HERB_REGISTRY).length}`);
  
  const issues: string[] = [];
  selected100.forEach((h, i) => {
    const s = h.scientificName.toLowerCase().trim();
    const l = h.localName.toLowerCase().trim();
    if (dbSci.has(s)) issues.push(`[#${i + 1}] ${h.localName}: Scientific '${h.scientificName}' already in DB`);
    if (dbLocal.has(l)) issues.push(`[#${i + 1}] ${h.localName}: Local '${h.localName}' already in DB`);
    if (regSci.has(s)) issues.push(`[#${i + 1}] ${h.localName}: Scientific '${h.scientificName}' matches REGIONAL_HERB_REGISTRY`);
    if (regCanon.has(l)) issues.push(`[#${i + 1}] ${h.localName}: Local '${h.localName}' matches REGIONAL_HERB_REGISTRY canonical`);
  });

  if (issues.length > 0) {
    console.log('Issues found:', issues);
  } else {
    console.log('PERFECT! Zero matches with DB and zero matches with current REGIONAL_HERB_REGISTRY!');
  }
  process.exit(0);
}

check().catch((e) => {
  console.error(e);
  process.exit(1);
});
