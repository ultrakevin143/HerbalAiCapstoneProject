import { prisma } from '../src/lib/prisma.js';
import { generateEmbedding } from '../src/services/ai/core/gemini-service.js';
import { searchSimilarHerbs } from '../src/repositories/herb.repository.js';

async function testDrAiRetrieval() {
  console.log('=== TESTING DR. AI VECTOR RETRIEVAL (88/88 COVERAGE) ===');

  const testPrompts = [
    'What herb helps with respiratory problems, cough, or asthma?',
    'I need an herb for skin rash, fungal infection, or wound wash.',
    'What plant is good for digestion, stomach ache, or colic?',
    'What herb is used as a poultice for furuncles, pigsa, boils, or skin pruritus?'
  ];

  for (const prompt of testPrompts) {
    console.log(`\nQuery: "${prompt}"`);
    const vector = await generateEmbedding(prompt);
    const vectorStr = `[${vector.join(',')}]`;
    const results = await searchSimilarHerbs(vectorStr, 3);
    console.log('Retrieved Herbs:');
    results.forEach((r, idx) => {
      console.log(`  ${idx + 1}. ${r.localName} (${r.scientificName}) - distance: ${Number(r.distance).toFixed(4)}`);
    });
  }
}

testDrAiRetrieval()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
