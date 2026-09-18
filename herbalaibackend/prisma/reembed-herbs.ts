import { prisma } from "../src/lib/prisma.js";
import { generateEmbedding } from "../src/services/ai/core/gemini-service.js";

type HerbId = { id: string };

const main = async () => {
  const candidates = await prisma.$queryRawUnsafe<HerbId[]>(
    `SELECT id FROM "Herb"
     WHERE "publicationStatus" = 'PUBLISHED'::"HerbPublicationStatus"
       AND "isVerified" = true
       AND embedding IS NULL
     ORDER BY "localName" ASC`
  );

  let completed = 0;
  const failures: string[] = [];

  for (const candidate of candidates) {
    const herb = await prisma.herb.findUnique({ where: { id: candidate.id } });
    if (!herb) continue;

    const embeddingText = [
      herb.localName,
      herb.scientificName,
      herb.sourceScientificName,
      herb.category,
      herb.evidenceClass,
      herb.medicinalUses,
      herb.preparationMethod,
      herb.dosage,
      herb.warnings,
    ].filter(Boolean).join(" ");

    try {
      const embedding = await generateEmbedding(embeddingText);
      await prisma.$executeRawUnsafe(
        `UPDATE "Herb" SET embedding = $1::vector, "updatedAt" = NOW() WHERE id = $2`,
        `[${embedding.join(",")}]`,
        herb.id
      );
      completed += 1;
      console.log(`Embedded ${herb.localName}`);
    } catch (error) {
      failures.push(herb.localName);
      console.error(`Could not embed ${herb.localName}:`, error);
    }
  }

  console.log(`Embedding refresh complete: ${completed}/${candidates.length}`);
  if (failures.length > 0) {
    throw new Error(`Embedding refresh failed for: ${failures.join(", ")}`);
  }
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
