import { prisma } from '../src/lib/prisma.js';
import * as fs from 'fs';
import * as path from 'path';

async function scanHerbs() {
  console.log('--- Scanning Herb Library for Missing Images ---');

  const frontendPublicDir = path.resolve('..', 'herbalaifrontend', 'public');

  const allHerbs = await prisma.herb.findMany({
    where: { publicationStatus: 'PUBLISHED' },
    select: {
      id: true,
      localName: true,
      scientificName: true,
      category: true,
      imageUrl: true,
      imageCreator: true,
      imageSourceUrl: true,
    },
    orderBy: { localName: 'asc' },
  });

  console.log(`Total Published Herbs in Library: ${allHerbs.length}`);

  const withImages: any[] = [];
  const withoutImages: any[] = [];

  for (const h of allHerbs) {
    if (!h.imageUrl || h.imageUrl.trim() === '') {
      withoutImages.push({ ...h, reason: 'No URL set (null or empty)' });
      continue;
    }

    if (h.imageUrl.includes('placeholder')) {
      withoutImages.push({ ...h, reason: 'Placeholder image' });
      continue;
    }

    // If it's a local path like /images/herbs/foo.jpg, check if the file actually exists
    if (h.imageUrl.startsWith('/')) {
      const localFilePath = path.join(frontendPublicDir, h.imageUrl.replace(/^\//, ''));
      if (!fs.existsSync(localFilePath)) {
        withoutImages.push({ ...h, reason: `Local file not found: ${h.imageUrl}` });
        continue;
      }
    }

    withImages.push(h);
  }

  console.log(`\n========================================`);
  console.log(`SCAN RESULTS:`);
  console.log(`✅ Herbs WITH valid images: ${withImages.length}`);
  console.log(`❌ Herbs WITHOUT images (or placeholders): ${withoutImages.length}`);
  console.log(`========================================\n`);

  // Write a clear report
  let report = `# Herb Library Image Scan Report\n\n`;
  report += `> **Total Published Herbs**: ${allHerbs.length}\n`;
  report += `> **Herbs With Valid Images**: ${withImages.length}\n`;
  report += `> **Herbs Needing Images**: ${withoutImages.length}\n\n`;

  report += `## Herbs Needing Images (${withoutImages.length})\n\n`;
  report += `| # | Local Name | Scientific Name | Category | Status / Issue |\n`;
  report += `|---|---|---|---|---|\n`;

  withoutImages.forEach((h, i) => {
    report += `| ${i + 1} | **${h.localName}** | *${h.scientificName}* | ${h.category} | ${h.reason} |\n`;
  });

  report += `\n## Herbs With Valid Images (${withImages.length})\n\n`;
  report += `| # | Local Name | Scientific Name | Image Source / Host |\n`;
  report += `|---|---|---|---|\n`;
  withImages.forEach((h, i) => {
    const host = h.imageUrl.includes('cloudinary') ? 'Cloudinary CDN' : 'Local Public Asset';
    report += `| ${i + 1} | **${h.localName}** | *${h.scientificName}* | ${host} |\n`;
  });

  const outPath = path.resolve('..', 'HERBS_WITHOUT_IMAGES_REPORT.md');
  fs.writeFileSync(outPath, report, 'utf-8');
  console.log(`Detailed report saved to: ${outPath}`);

  // Print the herbs without images to stdout
  console.log(`List of ${withoutImages.length} herbs without images:`);
  withoutImages.forEach((h, idx) => {
    console.log(`${idx + 1}. ${h.localName} (${h.scientificName}) - [${h.category}] - ${h.reason}`);
  });

  process.exit(0);
}

scanHerbs().catch((err) => {
  console.error(err);
  process.exit(1);
});
