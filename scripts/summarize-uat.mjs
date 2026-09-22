import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const formDirectory = path.join(root, 'Docs', 'UAT_2026-09-22');
const participantIds = Array.from({ length: 5 }, (_, index) => `UAT-${String(index + 1).padStart(2, '0')}`);
const acceptedStatuses = new Map([
  ['pass', 'Pass'],
  ['fail', 'Fail'],
  ['blocked', 'Blocked'],
  ['not run', 'Not Run'],
]);
const totals = { Pass: 0, Fail: 0, Blocked: 0, 'Not Run': 0 };
const incomplete = [];

for (const participantId of participantIds) {
  const filePath = path.join(formDirectory, `${participantId}.md`);
  const content = await fs.readFile(filePath, 'utf8');
  const scenarioRows = content.split(/\r?\n/).filter((line) => /^\| UAT-(?:0[1-9]|10) \|/.test(line));

  if (scenarioRows.length !== 10) {
    throw new Error(`${participantId} must contain exactly 10 common UAT scenario rows.`);
  }

  for (const row of scenarioRows) {
    const cells = row.split('|').map((cell) => cell.trim());
    const scenarioId = cells[1];
    const normalizedStatus = cells[2].toLowerCase().replaceAll(/s+/g, ' ');
    const status = acceptedStatuses.get(normalizedStatus);
    if (!status) {
      incomplete.push(`${participantId}/${scenarioId}`);
      continue;
    }
    totals[status] += 1;
  }
}

const executed = totals.Pass + totals.Fail + totals.Blocked;
const passRate = executed === 0 ? 0 : (totals.Pass / executed) * 100;

console.log(`Participants with prepared forms: ${participantIds.length}/5`);
console.log(`Scenario results: Pass=${totals.Pass} Fail=${totals.Fail} Blocked=${totals.Blocked} Not Run=${totals['Not Run']}`);
console.log(`Executed-scenario pass rate: ${passRate.toFixed(1)}%`);

if (incomplete.length > 0) {
  console.error(`UAT remains incomplete: ${incomplete.length} blank or invalid scenario result(s).`);
  process.exitCode = 1;
} else {
  console.log('All five UAT forms contain a recorded status for every common scenario. Human review and signatures are still required.');
}
