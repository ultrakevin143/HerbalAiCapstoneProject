import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const workflowUrl = new URL('../../.github/workflows/herb-preparation-ci.yml', import.meta.url);
const workflow = existsSync(workflowUrl) ? readFileSync(workflowUrl, 'utf8').replace(/\r\n/g, '\n') : '';
const step = (name: string): string => {
  const match = workflow.match(new RegExp(`^      - name: ${name}\n([\\s\\S]*?)(?=^      - name: |$(?![\\s\\S]))`, 'm'));
  return match?.[1] ?? '';
};
const testUrl = 'postgresql://test_user:test_password@127.0.0.1:5432/herbalai_test?sslmode=disable';

describe('preparation-only PostgreSQL CI gate', () => {
  it('provides a disposable pgvector test database, read-only GitHub permissions and a bounded job', () => {
    expect(workflow).toContain('image: pgvector/pgvector:pg16');
    expect(workflow).toContain('POSTGRES_DB: herbalai_test');
    expect(workflow).toContain('contents: read');
    expect(workflow).toContain('timeout-minutes: 15');
    expect(workflow).not.toMatch(/secrets\.|environment:|deploy:bootstrap|herbs:publish|embed:herbs|prisma db push/);
  });

  it('runs on the reviewed CI branch and relevant pull requests', () => {
    expect(workflow).toContain('branches: ["codex/mvp-acceptance-ci"]');
    expect(workflow).toContain('branches: ["main", "master", "develop"]');
    expect(workflow).toContain('"herbalaibackend/**"');
    expect(workflow).toContain('".github/workflows/herb-preparation-ci.yml"');
  });

  it('uses the guarded runner with an explicit isolated target instead of independent unguarded migrations', () => {
    const gate = step('Run guarded preparation PostgreSQL gate');
    expect(gate).toContain(`HERBALAI_TEST_DATABASE_URL: ${testUrl}`);
    expect(gate).toContain('run: npm run test:preparations:database');
    expect(workflow).not.toMatch(/run:.*prisma (generate|migrate deploy)/);
  });

  it('strictly checks tooling and tests excluded from the application tsconfig', () => {
    const check = step('Strictly typecheck preparation tooling');
    for (const option of ['--noEmit', '--module nodenext', '--strict', '--exactOptionalPropertyTypes', '--noUncheckedIndexedAccess']) {
      expect(check).toContain(option);
    }
    for (const file of ['prisma/test-herb-preparations.ts', 'prisma/update-herb-preparations.ts',
      'tests/herb-preparation-ci.test.ts', 'tests/herb-preparation-isolated-runner.test.ts',
      'tests/herb-preparation-update-database.test.ts', 'tests/herb-preparation-source-tags.test.ts',
      'tests/herb-preparation-source-tag-release.test.ts', 'tests/herb-preparation-source-tag-release-database.test.ts',
      'tests/helpers/source-tag-fixture.ts']) expect(check).toContain(file);
  });

  it('pins both URLs and disables dotenv/provider access for non-database boundary checks', () => {
    const check = step('Run preparation boundary regressions');
    expect(check).toContain(`DATABASE_URL: ${testUrl}`);
    expect(check).toContain(`DIRECT_URL: ${testUrl}`);
    expect(check).toContain('DOTENV_CONFIG_PATH: /dev/null');
    expect(check).toContain('GEMINI_API_KEY: ""');
    expect(check).toContain('NODE_ENV: test');
    for (const file of ['herb-preparation-ci.test.ts', 'herb-preparation-isolated-runner.test.ts',
      'herb-preparation-update.test.ts', 'herb-preparation-release.test.ts', 'herb-preparation-source-tags.test.ts',
      'herb-preparation-source-tag-release.test.ts', 'herb-beginner-guide.test.ts', 'gemini-fallback.test.ts']) expect(check).toContain(file);
    expect(check).not.toContain('herb-preparation-update-database.test.ts');
    expect(check).not.toContain('herb-preparation-source-tag-release-database.test.ts');
  });

  it('cannot hide a failed gate behind continuation or conditional failure bypass', () => {
    expect(workflow).not.toMatch(/continue-on-error|always\(\)|\|\|\s*true|allow_failure/);
    const names = ['Install backend dependencies', 'Strictly typecheck preparation tooling',
      'Run preparation boundary regressions', 'Run guarded preparation PostgreSQL gate'];
    const indexes = names.map(name => workflow.indexOf(`- name: ${name}`));
    expect(indexes.every(index => index >= 0)).toBe(true);
    expect(indexes).toEqual([...indexes].sort((left, right) => left - right));
  });

  it('keeps eight enabled SQL regressions in the dedicated fixture suite', () => {
    const suite = readFileSync(new URL('./herb-preparation-update-database.test.ts', import.meta.url), 'utf8');
    expect([...suite.matchAll(/^ {2}it\('/gm)]).toHaveLength(8);
    expect(suite).not.toMatch(/\b(?:it|describe)\.(?:skip|todo|only)\b/);
    expect(suite).toContain("connection.pathname !== '/herbalai_test'");
  });
});
