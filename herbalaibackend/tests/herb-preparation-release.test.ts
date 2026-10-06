import { readFileSync } from 'node:fs';
import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { PoolClient } from 'pg';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { assertPreparationBackupPath, assertPreparationCatalogIdentity, parsePreparationReleaseArguments,
  preparationPoolOptions, readOnlyPreparationPlan, readPublicPreparationCatalog } from '../src/content/herb-preparation-release.js';
import { genericPreparation } from '../src/content/herb-preparation-update.js';

const args = ['--prepare', '--backup', path.join(tmpdir(), 'qa-preparation-export.json'), '--expected-host', 'localhost', '--expected-database', 'herbalai_test'];
const directories: string[] = [];
afterEach(async () => { for (const directory of directories.splice(0)) await rm(directory, { recursive: true, force: true }); });
const directoryFixture = async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'herbalai-release-boundary-'));
  directories.push(directory);
  const root = path.join(directory, 'repository');
  const outside = path.join(directory, 'exports');
  await Promise.all([mkdir(root), mkdir(outside)]);
  return { directory, root, outside };
};

describe('preparation release arguments', () => {
  it('allows only standalone help without needing any provider configuration', () => {
    expect(parsePreparationReleaseArguments(['--help']).mode).toBe('help');
    expect(() => parsePreparationReleaseArguments(['--help', '--apply'])).toThrow();
  });

  it('parses an explicit read-only preparation request', () => {
    expect(parsePreparationReleaseArguments(args)).toMatchObject({ mode: 'prepare', target: { host: 'localhost', database: 'herbalai_test' } });
  });

  it.each([
    [...args, '--prepare'], [...args, '--expected-host', 'other-host'], [...args, 'unexpected-positional-value'],
    [...args, '--reviewer-id', 'admin'], [...args, '--apply'], ['--prepare', '--backup', '--expected-host'],
    [...args.slice(0, 4), '   ', ...args.slice(5)], [...args, '--publish'],
  ].map(invalid => ({ invalid })))('refuses ambiguous or malformed arguments before any connection: $invalid', ({ invalid }) => {
    expect(() => parsePreparationReleaseArguments(invalid)).toThrow();
  });

  it('requires a valid reviewed digest and reviewer for apply', () => {
    const apply = ['--apply', ...args.slice(1), '--reviewer-id', 'qa-reviewer', '--reviewed-plan-sha', 'a'.repeat(64)];
    expect(parsePreparationReleaseArguments(apply)).toMatchObject({ mode: 'apply', reviewerId: 'qa-reviewer' });
    expect(() => parsePreparationReleaseArguments([...apply.slice(0, -1), 'not-a-digest'])).toThrow();
    expect(() => parsePreparationReleaseArguments(['--apply', ...args.slice(1)])).toThrow();
  });

  it('wires the guarded argument parser into the real CLI before reading provider configuration', () => {
    const execute = (parameters: string[]) => spawnSync(process.execPath, ['--import', 'tsx', 'prisma/update-herb-preparations.ts', ...parameters], {
      cwd: fileURLToPath(new URL('../', import.meta.url)), encoding: 'utf8', timeout: 10_000,
      env: { ...process.env, DATABASE_URL: 'not-a-database-url', GEMINI_API_KEY: '' },
    });
    const help = execute(['--help']);
    expect(help.error).toBeUndefined();
    expect(help.status).toBe(0);
    expect(help.stdout).toContain('Preparation-only release');
    for (const parameters of [['--help', '--apply'], [...args, '--prepare']]) {
      const refused = execute(parameters);
      expect(refused.error).toBeUndefined();
      expect(refused.status).toBe(1);
      expect(refused.stderr).toContain('Preparation release stopped');
      expect(refused.stdout).not.toContain('PREPARATION_UPDATE_COMMITTED');
    }
  });
});

describe('recovery export location', () => {
  it('accepts a sibling export directory and refuses paths inside the repository', async () => {
    const fixture = await directoryFixture();
    await expect(assertPreparationBackupPath(fixture.root, path.join(fixture.outside, 'backup.json'))).resolves.toBe(path.join(fixture.outside, 'backup.json'));
    await expect(assertPreparationBackupPath(fixture.root, path.join(fixture.root, 'backup.json'))).rejects.toThrow(/outside/);
  });

  it('refuses an outside-looking directory junction that resolves inside the repository', async () => {
    const fixture = await directoryFixture();
    const linked = path.join(fixture.directory, 'linked-export');
    await symlink(fixture.root, linked, process.platform === 'win32' ? 'junction' : 'dir');
    await expect(assertPreparationBackupPath(fixture.root, path.join(linked, 'backup.json'))).rejects.toThrow(/outside/);
  });

  it('checks the real location even when the selected repository root itself is a junction', async () => {
    const fixture = await directoryFixture();
    const linkedRoot = path.join(fixture.directory, 'linked-repository');
    await symlink(fixture.root, linkedRoot, process.platform === 'win32' ? 'junction' : 'dir');
    await expect(assertPreparationBackupPath(linkedRoot, path.join(fixture.root, 'backup.json'))).rejects.toThrow(/outside/);
  });

  it('requires an existing export parent rather than pretending a path is ready', async () => {
    const fixture = await directoryFixture();
    await expect(assertPreparationBackupPath(fixture.root, path.join(fixture.directory, 'missing', 'backup.json'))).rejects.toThrow();
    await writeFile(path.join(fixture.outside, 'backup.json'), 'TEST ONLY');
    await expect(assertPreparationBackupPath(fixture.root, path.join(fixture.outside, 'backup.json'))).resolves.toBe(path.join(fixture.outside, 'backup.json'));
  });

  it('returns a physical outside path rather than leaving a mutable junction in the export filename', async () => {
    const fixture = await directoryFixture();
    const linked = path.join(fixture.directory, 'safe-linked-export');
    await symlink(fixture.outside, linked, process.platform === 'win32' ? 'junction' : 'dir');
    await expect(assertPreparationBackupPath(fixture.root, path.join(linked, 'backup.json'))).resolves.toBe(path.join(fixture.outside, 'backup.json'));
  });

  it('rejects a directory in place of a recovery file', async () => {
    const fixture = await directoryFixture();
    const filename = path.join(fixture.outside, 'backup.json');
    await mkdir(filename);
    await expect(assertPreparationBackupPath(fixture.root, filename)).rejects.toThrow(/regular file/);
  });
});

describe('read-only release snapshot orchestration (mocked SQL, not PostgreSQL concurrency evidence)', () => {
  it('bounds connection, lock, server statement and client query waits', () => {
    expect(preparationPoolOptions('postgresql://localhost/herbalai_test')).toMatchObject({
      max: 1, connectionTimeoutMillis: 10_000, query_timeout: 15_000,
      statement_timeout: 10_000, lock_timeout: 5_000, idle_in_transaction_session_timeout: 15_000,
    });
  });

  it('refuses routing and timeout overrides before constructing a release pool', () => {
    for (const parameter of ['host=example.invalid', 'statement_timeout=0', 'query_timeout=0', 'connectionTimeoutMillis=0']) {
      expect(() => preparationPoolOptions(`postgresql://localhost/herbalai_test?${parameter}`)).toThrow();
    }
  });
  const batch = JSON.parse(readFileSync(new URL('../content/herbs/expansion-batch-02.json', import.meta.url), 'utf8')) as {
    herbs: Array<{ id: string; localName: string; scientificName: string }>;
  };
  const catalog = batch.herbs.map(({ id, localName, scientificName }) => ({ id, localName, scientificName })).sort((left, right) => left.id.localeCompare(right.id));
  const queryFixture = () => vi.fn(async (sql: string) => {
    if (sql.startsWith('SELECT id,')) return { rows: catalog };
    if (sql.includes('to_jsonb(herb)')) return { rows: batch.herbs.map(herb => ({ document: {
      ...herb, provenance: 'BUILT_IN', publicationStatus: 'PUBLISHED', isVerified: true,
      preparationMethod: genericPreparation, dosage: 'Original dosage', warnings: 'Original warning',
      updatedAt: '2026-10-05T12:00:00.000Z', embedding: null,
    } })) };
    return { rows: [] };
  });

  it('uses one bounded repeatable-read snapshot for public identity, herb and source comparison', async () => {
    const query = queryFixture();
    const plan = await readOnlyPreparationPlan({ query } as unknown as PoolClient, batch, { host: 'localhost', database: 'herbalai_test' }, catalog);
    expect(plan.records).toHaveLength(20);
    const statements = query.mock.calls.map(call => call[0]);
    expect(statements[0]).toBe('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
    expect(statements[1]).toContain('statement_timeout');
    expect(statements[2]).toContain('lock_timeout');
    expect(statements.at(-1)).toBe('ROLLBACK');
    expect(statements.some(sql => /INSERT|UPDATE|DELETE|COMMIT/.test(sql))).toBe(false);
  });

  it('releases the read transaction after a catalog mismatch and never builds an export', async () => {
    const query = queryFixture();
    await expect(readOnlyPreparationPlan({ query } as unknown as PoolClient, batch, { host: 'localhost', database: 'herbalai_test' }, [])).rejects.toThrow(/catalog/);
    expect(query.mock.calls.at(-1)?.[0]).toBe('ROLLBACK');
  });

  it('rolls back the read transaction if source retrieval fails', async () => {
    const query = queryFixture();
    const original = query.getMockImplementation()!;
    query.mockImplementation(async sql => {
      if (sql.includes('to_jsonb(source)')) throw new Error('TEST ONLY snapshot source failure');
      return original(sql);
    });
    await expect(readOnlyPreparationPlan({ query } as unknown as PoolClient, batch, { host: 'localhost', database: 'herbalai_test' }, catalog)).rejects.toThrow(/source failure/);
    expect(query.mock.calls.at(-1)?.[0]).toBe('ROLLBACK');
  });

  it('compares complete identities independent of database row order', async () => {
    const query = vi.fn().mockResolvedValue({ rows: [...catalog].reverse() });
    await expect(assertPreparationCatalogIdentity({ query } as unknown as PoolClient, catalog)).resolves.toBeUndefined();
  });

  it.each([
    { status: 'success', data: { total: 21, herbs: catalog } },
    { status: 'success', data: { total: 2, herbs: [catalog[0], catalog[0]] } },
    { status: 'success', data: { total: 1, herbs: [{ id: '', localName: 'QA', scientificName: 'QA' }] } },
  ])('refuses incomplete, duplicated or malformed public catalog responses', async payload => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify(payload), { status: 200 }));
    await expect(readPublicPreparationCatalog(request)).rejects.toThrow();
  });

  it('uses a bounded no-store public read and rejects an HTTP failure', async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ status: 'success', data: { total: catalog.length, herbs: catalog } })));
    expect(await readPublicPreparationCatalog(request)).toEqual(catalog);
    expect(request.mock.calls[0]?.[1]).toMatchObject({ cache: 'no-store', signal: expect.any(AbortSignal) });
    request.mockResolvedValue(new Response('', { status: 503 }));
    await expect(readPublicPreparationCatalog(request)).rejects.toThrow(/read failed/);
  });
});
import { spawnSync } from 'node:child_process';
