import { prisma } from '../src/lib/prisma.js';

async function main() {
  const grouped = await prisma.herb.groupBy({
    by: ['publicationStatus'],
    _count: { id: true },
  });
  console.log('Publication status counts:', grouped);

  const herbs = await prisma.herb.findMany({
    select: {
      id: true,
      localName: true,
      scientificName: true,
      category: true,
      publicationStatus: true,
    },
  });

  const testNames = ['paragis', 'eleusine', 'alagaw', 'premna', 'avocado', 'persea', 'guyabano', 'annona', 'cassia', 'vitex'];
  for (const t of testNames) {
    const found = herbs.filter(h => h.localName.toLowerCase().includes(t) || h.scientificName.toLowerCase().includes(t));
    if (found.length > 0) {
      console.log(`Matched "${t}":`, found.map(f => `${f.localName} (${f.scientificName})`));
    }
  }
  process.exit(0);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
