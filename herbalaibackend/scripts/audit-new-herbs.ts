import { prisma } from '../src/lib/prisma.js';

async function audit() {
  console.log('--- Auditing All 100 Added Herbs in Database ---');
  const herbs = await prisma.herb.findMany({
    where: { provenance: 'ADMIN_CREATED' },
    include: { sources: true },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`Retrieved ${herbs.length} newly added herbs.`);

  let missingPrep = 0;
  let missingDosage = 0;
  let missingUses = 0;
  let missingWarnings = 0;
  let missingCebuano = 0;
  let missingRegion = 0;
  let missingSources = 0;

  const sampleAudits: any[] = [];
  const needsRefinement: any[] = [];

  for (let i = 0; i < herbs.length; i++) {
    const h = herbs[i];

    if (!h.preparationMethod || h.preparationMethod.trim().length === 0) missingPrep++;
    if (!h.dosage || h.dosage.trim().length === 0) missingDosage++;
    if (!h.medicinalUses || h.medicinalUses.trim().length === 0) missingUses++;
    if (!h.warnings || h.warnings.trim().length === 0) missingWarnings++;
    if (!h.cebuanoName || h.cebuanoName.trim().length === 0) missingCebuano++;
    if (!h.regionFound || h.regionFound.trim().length === 0) missingRegion++;
    if (!h.sources || h.sources.length === 0) missingSources++;

    // Check preparation method quality:
    // A quality preparation method specifies:
    // 1. Plant part (leaf, bark, root, flower, fruit, seed, sap, rhizome, resin)
    // 2. Action (boil, decoct, infuse, steep, crush, pound, poultice, extract, dilute)
    // 3. Proportions / duration / liquid amount (cups, minutes, grams, tbsp)
    const prep = h.preparationMethod.toLowerCase();
    const hasPlantPart = /leaf|leaves|bark|root|rhizome|flower|seed|fruit|stem|sap|resin|latex|pod|shoot|tuber|pith|wood/.test(prep);
    const hasAction = /boil|decoct|infuse|steep|crush|pound|poultice|extract|apply|rub|dilute|wash|simmer|cook|blend/.test(prep);
    const hasMeasureOrTime = /cup|cups|glass|glasses|liter|gram|grams|g|tbsp|tablespoon|min|minute|minutes|hour|hours|handful|piece/.test(prep);

    if (!hasPlantPart || !hasAction || !hasMeasureOrTime || h.preparationMethod.length < 40) {
      needsRefinement.push({
        index: i + 1,
        localName: h.localName,
        scientificName: h.scientificName,
        prep: h.preparationMethod,
        dosage: h.dosage,
        missingAspect: [
          !hasPlantPart ? 'plant part' : null,
          !hasAction ? 'action' : null,
          !hasMeasureOrTime ? 'measure/time' : null,
          h.preparationMethod.length < 40 ? 'too brief' : null,
        ].filter(Boolean).join(', '),
      });
    }

    // Capture first 5 and last 5 as audit samples
    if (i < 5 || i >= herbs.length - 5) {
      sampleAudits.push({
        index: i + 1,
        localName: h.localName,
        scientificName: h.scientificName,
        category: h.category,
        preparationMethod: h.preparationMethod,
        dosage: h.dosage,
        warnings: h.warnings,
        sourcesCount: h.sources.length,
      });
    }
  }

  console.log('\n--- Field Completeness Check ---');
  console.log(`Total Herbs Audited: ${herbs.length}`);
  console.log(`Missing Preparation Method: ${missingPrep}`);
  console.log(`Missing Dosage: ${missingDosage}`);
  console.log(`Missing Medicinal Uses: ${missingUses}`);
  console.log(`Missing Warnings: ${missingWarnings}`);
  console.log(`Missing Cebuano / Regional Name: ${missingCebuano}`);
  console.log(`Missing Region: ${missingRegion}`);
  console.log(`Missing Sources: ${missingSources}`);

  console.log(`\n--- Preparation Method Depth & Granularity Check ---`);
  console.log(`Herbs needing further refinement: ${needsRefinement.length}`);
  if (needsRefinement.length > 0) {
    console.log('Items flagged for refinement:');
    needsRefinement.forEach((n) => {
      console.log(`- [#${n.index}] ${n.localName} (${n.scientificName}) [Flag: ${n.missingAspect}]:\n  Prep: "${n.prep}"\n  Dose: "${n.dosage}"`);
    });
  }

  console.log('\n--- Sample Detailed Records ---');
  sampleAudits.forEach((s) => {
    console.log(`[#${s.index}] ${s.localName} (${s.scientificName}) - ${s.category}`);
    console.log(`  Preparation: ${s.preparationMethod}`);
    console.log(`  Dosage: ${s.dosage}`);
    console.log(`  Warnings: ${s.warnings}`);
    console.log(`  Sources: ${s.sourcesCount} linked citations\n`);
  });

  process.exit(0);
}

audit().catch((err) => {
  console.error(err);
  process.exit(1);
});
