import { prisma } from '../src/lib/prisma.js';
import * as fs from 'fs';

async function main() {
  const herbs = await prisma.herb.findMany({
    where: { provenance: 'ADMIN_CREATED' },
    select: {
      id: true,
      localName: true,
      scientificName: true,
      category: true,
      medicinalUses: true,
      preparationMethod: true,
      dosage: true,
      warnings: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  let output = `# Full Audit of 100 Added Herbs - Preparation Methods & Dosage\n\n`;
  herbs.forEach((h, i) => {
    output += `### ${i + 1}. ${h.localName} (*${h.scientificName}*) - ${h.category}\n`;
    output += `- **Uses**: ${h.medicinalUses}\n`;
    output += `- **Preparation**: ${h.preparationMethod}\n`;
    output += `- **Dosage**: ${h.dosage}\n`;
    output += `- **Warnings**: ${h.warnings}\n\n`;
  });

  fs.writeFileSync('audit-preparations-report.md', output, 'utf-8');
  console.log(`Saved audit report of all ${herbs.length} herbs to audit-preparations-report.md`);
  process.exit(0);
}

main().catch(console.error);
