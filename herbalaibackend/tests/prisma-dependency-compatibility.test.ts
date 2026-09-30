import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
const prismaRequire = createRequire(require.resolve('prisma/package.json'));
const configRequire = createRequire(prismaRequire.resolve('@prisma/config'));
const { deepmerge } = configRequire('deepmerge-ts') as {
  deepmerge: (...values: unknown[]) => unknown;
};
const { loadConfigFromFile } = configRequire('@prisma/config') as typeof import('@prisma/config');
const backendRoot = resolve(dirname(require.resolve('../package.json')));
const directUrl = 'postgresql://test_user:test_password@127.0.0.1:5432/herbalai_test?sslmode=disable';
const pooledUrl = 'postgresql://test_user:test_password@localhost:5432/herbalai_test?sslmode=disable';

describe('patched Prisma tooling dependencies', () => {
  beforeEach(() => {
    vi.stubEnv('DATABASE_URL', pooledUrl);
    vi.stubEnv('DIRECT_URL', directUrl);
  });

  afterEach(() => vi.unstubAllEnvs());

  it('merges recursive configuration graphs without stack exhaustion', () => {
    const recursive: Record<string, unknown> = { enabled: true };
    recursive.self = recursive;
    expect(() => deepmerge(recursive, recursive)).not.toThrow();
  });

  it('preserves record and array merging used by the configuration loader', () => {
    expect(deepmerge(
      { datasource: { url: directUrl }, migrations: { path: 'prisma/migrations' }, flags: ['first'] },
      { datasource: { shadowDatabaseUrl: pooledUrl }, flags: ['second'] },
    )).toEqual({
      datasource: { url: directUrl, shadowDatabaseUrl: pooledUrl },
      migrations: { path: 'prisma/migrations' },
      flags: ['first', 'second'],
    });
  });

  it('loads the real Prisma config and preserves the direct migration connection', async () => {
    const result = await loadConfigFromFile({ configRoot: backendRoot });
    expect(result.error).toBeUndefined();
    expect(result.config?.datasource?.url).toBe(directUrl);
    expect(result.config?.schema).toBe(resolve(backendRoot, 'prisma/schema.prisma'));
    expect(result.config?.migrations?.path).toBe(resolve(backendRoot, 'prisma/migrations'));
  });

  it('falls back to DATABASE_URL when DIRECT_URL is empty', async () => {
    vi.stubEnv('DIRECT_URL', '');
    const result = await loadConfigFromFile({ configRoot: backendRoot });
    expect(result.error).toBeUndefined();
    expect(result.config?.datasource?.url).toBe(pooledUrl);
  });

  it('resolves the reviewed patched versions from Prisma rather than an unrelated dependency copy', () => {
    const manifest = require('../package.json') as {
      overrides: { '@prisma/config': { 'deepmerge-ts': string }; prisma: { mysql2: string } };
    };
    const deepmergeManifest = JSON.parse(readFileSync(
      resolve(dirname(configRequire.resolve('deepmerge-ts')), '../package.json'), 'utf8',
    )) as { version: string };
    const mysqlManifest = prismaRequire('mysql2/package.json') as { version: string };
    expect(deepmergeManifest.version).toBe('8.0.0');
    expect(mysqlManifest.version).toBe('3.24.5');
    expect(deepmergeManifest.version).toBe(manifest.overrides['@prisma/config']['deepmerge-ts']);
    expect(mysqlManifest.version).toBe(manifest.overrides.prisma.mysql2);
  });
});
