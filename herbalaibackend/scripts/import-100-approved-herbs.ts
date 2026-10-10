import { prisma } from '../src/lib/prisma.js';
import { proposedHerbs } from './verify-proposed-herbs.js';

async function importApprovedHerbs() {
  console.log('--- Starting Ingestion of Approved 100 Philippine Herbs ---');

  const approved100 = proposedHerbs.slice(0, 100);
  console.log(`Loaded ${approved100.length} approved herbs for ingestion.`);

  // 1. Pre-flight collision check
  const existingHerbs = await prisma.herb.findMany({
    select: {
      id: true,
      localName: true,
      scientificName: true,
    },
  });

  const existingSciMap = new Map(existingHerbs.map((h) => [h.scientificName.toLowerCase().trim(), h.id]));
  const existingLocalMap = new Map(existingHerbs.map((h) => [h.localName.toLowerCase().trim(), h.id]));

  console.log(`Current DB contains ${existingHerbs.length} herbs.`);

  let createdCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < approved100.length; i++) {
    const item = approved100[i];
    const sLower = item.scientificName.toLowerCase().trim();
    const lLower = item.localName.toLowerCase().trim();

    if (existingSciMap.has(sLower) || existingLocalMap.has(lLower)) {
      console.warn(`[SKIP] #${i + 1} "${item.localName}" (${item.scientificName}) already exists in DB!`);
      skippedCount++;
      continue;
    }

    // Insert Herb record
    const createdHerb = await prisma.herb.create({
      data: {
        localName: item.localName,
        cebuanoName: item.cebuanoName || null,
        scientificName: item.scientificName,
        sourceScientificName: item.scientificName,
        category: item.category,
        medicinalUses: item.medicinalUses,
        preparationMethod: item.preparationMethod,
        dosage: item.dosage,
        regionFound: 'Distributed across various Philippine provinces and native habitats.',
        warnings: item.warnings,
        imageUrl: '/images/herbs/placeholder.jpg',
        isDohApproved: false,
        isVerified: true,
        publicationStatus: 'PUBLISHED',
        evidenceClass: 'DOCUMENTED_TRADITIONAL_USE',
        provenance: 'ADMIN_CREATED',
        reviewedAt: new Date(),
        sources: {
          create: [
            {
              title: `StuartXchange Philippine Medicinal Plants (${item.scientificName})`,
              publisher: 'StuartXchange / Philippine Ethnobotanical Compendium',
              url: 'https://www.stuartxchange.org',
              citation: item.informationSource,
              supports: ['medicinalUses', 'preparationMethod', 'dosage'],
              accessedAt: new Date(),
            },
          ],
        },
      },
    });

    existingSciMap.set(sLower, createdHerb.id);
    existingLocalMap.set(lLower, createdHerb.id);
    createdCount++;

    if (createdCount % 20 === 0 || createdCount === 100) {
      console.log(`[PROGRESS] Ingested ${createdCount} / 100 herbs...`);
    }
  }

  console.log('--- Ingestion Summary ---');
  console.log(`Successfully created: ${createdCount}`);
  console.log(`Skipped existing: ${skippedCount}`);

  const totalInDb = await prisma.herb.count({
    where: { publicationStatus: 'PUBLISHED' },
  });
  console.log(`Total PUBLISHED herbs now in DB: ${totalInDb}`);

  process.exit(0);
}

importApprovedHerbs().catch((err) => {
  console.error('Fatal ingestion error:', err);
  process.exit(1);
});
