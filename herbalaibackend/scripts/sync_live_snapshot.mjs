import { prisma } from '../src/lib/prisma.js';
import fs from 'node:fs';

async function syncSnapshot() {
  const allHerbs = await prisma.herb.findMany({
    orderBy: { localName: 'asc' },
    include: { sources: true }
  });

  console.log(`Fetched ${allHerbs.length} herbs from live DB.`);
  fs.writeFileSync(
    'C:/Users/Hp/.gemini/antigravity-ide/brain/62981fae-ac99-41af-ab8f-9513f00d7914/scratch/all_88_herbs_live.json',
    JSON.stringify(allHerbs, null, 2),
    'utf8'
  );
  console.log('Saved updated live snapshot.');

  await prisma.$disconnect();
}

syncSnapshot();
