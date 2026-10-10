import { prisma, closeDatabasePool } from '../src/lib/prisma.js';
import { generateEmbedding } from '../src/services/ai/core/gemini-service.js';

async function main() {
  try {
    const niog = await prisma.herb.findFirst({
      where: {
        OR: [
          { localName: { equals: 'Niog', mode: 'insensitive' } },
          { scientificName: { contains: 'Cocos nucifera', mode: 'insensitive' } }
        ]
      }
    });

    if (!niog) {
      throw new Error('Niog (Cocos nucifera) not found in database');
    }

    console.log(`Found Niog record: ${niog.id} (${niog.localName} - ${niog.scientificName})`);

    const updatedMedicinalUses = 
      "Historically, coconut products (water, meat, and oil) have been documented in traditional Philippine ethnobotany for multiple health applications. " +
      "Notably, scientific and clinical evaluations demonstrate that fresh young coconut water (tubig ng buko / butong) significantly increases urinary citrate excretion, along with potassium and chloride. " +
      "Citrate is a potent natural inhibitor of calcium oxalate crystal nucleation, growth, and aggregation in the urinary tract. " +
      "By increasing urinary citrate excretion and enhancing fluid output, coconut water acts as a natural prophylactic aid that helps prevent kidney stone formation (calcium oxalate nephrolithiasis and urolithiasis) and supports overall urinary tract flushing.";

    const updatedPreparationMethod = 
      "Drink fresh young coconut water (tubig ng buko / butong) extracted directly from freshly cracked green coconuts. " +
      "Consume fresh, raw, and unfermented without adding refined sugar or artificial flavorings. " +
      "The soft, tender coconut meat can be consumed fresh alongside the water for nutrition. " +
      "For topical care, virgin coconut oil (VCO) extracted from mature grated coconut meat is traditionally applied as a natural skin emollient and hair moisturizer.";

    const updatedDosage = 
      "For urinary hydration and prophylactic kidney stone support: 1 to 2 glasses (approx. 250 to 500 mL) of fresh young coconut water daily, consumed alongside adequate plain water intake. " +
      "Consume within a few hours of opening to maintain freshness and prevent fermentation.";

    const updatedWarnings = 
      "High Potassium Content (Hyperkalemia Warning): Young coconut water is naturally high in potassium and electrolytes. " +
      "Individuals with Chronic Kidney Disease (CKD), stage 3-5 renal impairment, or those taking potassium-sparing diuretics or ACE inhibitors must strictly consult a physician or nephrologist before consuming coconut water. " +
      "Prophylactic / Prevention Only: Coconut water helps inhibit crystal aggregation and flushes the urinary tract, but it is NOT an emergency cure or dissolution treatment for large, obstructing, or infected kidney stones. " +
      "Seek urgent medical evaluation if experiencing acute flank pain, bloody urine (hematuria), vomiting, or fever.";

    // Update the Herb record
    const updated = await prisma.herb.update({
      where: { id: niog.id },
      data: {
        evidenceClass: 'EVIDENCE_SUPPORTED_PHILIPPINE_USE',
        medicinalUses: updatedMedicinalUses,
        preparationMethod: updatedPreparationMethod,
        dosage: updatedDosage,
        warnings: updatedWarnings,
        category: 'Kidney, Urinary & General Wellness',
      }
    });

    console.log('Updated Niog text fields successfully.');

    // Add or update the clinical research source
    const existingSource = await prisma.herbSource.findFirst({
      where: {
        herbId: niog.id,
        title: { contains: 'Nephrolithiasis', mode: 'insensitive' }
      }
    });

    if (!existingSource) {
      await prisma.herbSource.create({
        data: {
          herbId: niog.id,
          title: "Prophylactic Effect of Coconut Water (Cocos nucifera L.) on Nephrolithiasis & Urinary Citrate Excretion",
          publisher: "PubMed / Biomedicine & Pharmacotherapy / Int Braz J Urol",
          url: "https://pubmed.ncbi.nlm.nih.gov/24021288/",
          citation: "Gandhi M et al. Prophylactic effect of coconut water (Cocos nucifera L.) on ethylene glycol induced nephrocalcinosis in male Sprague-Dawley rats. Biomed Pharmacother 2013; Patel RM et al. Coconut water: an unexpected source of urinary citrate. Int Braz J Urol 2018; 44(2): 345-352.",
          supports: ["medicinalUses", "preparationMethod", "dosage", "warnings"],
          accessedAt: new Date(),
        }
      });
      console.log('Added peer-reviewed scientific source for coconut water & urinary citrate.');
    }

    // Regenerate Vector Embedding
    const textToEmbed = [
      updated.localName,
      updated.cebuanoName,
      updated.scientificName,
      updated.category,
      updated.evidenceClass,
      updated.medicinalUses,
      updated.preparationMethod,
      updated.dosage,
      updated.warnings,
      "buko water coconut water kidney stones bato sa bato citrate urinary tract infection"
    ].filter(Boolean).join(" ");

    console.log('Generating updated Gemini vector embedding for Niog...');
    const embedding = await generateEmbedding(textToEmbed);
    if (embedding.length === 768) {
      await prisma.$executeRawUnsafe(
        `UPDATE "Herb" SET embedding = $1::vector, "updatedAt" = NOW() WHERE id = $2`,
        `[${embedding.join(",")}]`,
        niog.id
      );
      console.log('Successfully updated Niog vector embedding in Neon DB!');
    } else {
      console.warn(`Unexpected embedding length: ${embedding.length}`);
    }

  } finally {
    await closeDatabasePool();
  }
}

main().catch(console.error);
