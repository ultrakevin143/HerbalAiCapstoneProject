import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { isolatedPreparationEnvironment, isolatedPreparationSteps, runIsolatedPreparationTests } from '../prisma/test-herb-preparations.js';

vi.mock('node:child_process', async importOriginal => {
  const original = await importOriginal<typeof import('node:child_process')>();
  return { ...original, spawnSync: vi.fn(original.spawnSync) };
});

const backendRoot = fileURLToPath(new URL('../', import.meta.url));
const testUrl = 'postgresql://test_user:test_password@127.0.0.1:5432/herbalai_test?sslmode=disable';
const inherited = {
  HERBALAI_TEST_DATABASE_URL: testUrl,
  DATABASE_URL: 'postgresql://synthetic:synthetic@example.invalid/provider_database',
  DIRECT_URL: 'postgresql://synthetic:synthetic@example.invalid/provider_database',
  GEMINI_API_KEY: 'synthetic-provider-key', NODE_OPTIONS: '--require synthetic-hook',
  PGHOST: 'example.invalid', PGPASSWORD: 'synthetic-provider-password', PGOPTIONS: '-c search_path=other',
  CLOUDINARY_API_SECRET: 'synthetic-cloud-secret', JWT_SECRET: 'synthetic-auth-secret',
  DOTENV_CONFIG_PATH: 'synthetic-provider.env', DOTENV_CONFIG_OVERRIDE: 'true',
  Path: process.env['PATH'] ?? process.env['Path'] ?? '', SystemRoot: process.env['SYSTEMROOT'] ?? process.env['SystemRoot'] ?? '',
  TEMP: process.env['TEMP'] ?? '',
};

describe('isolated preparation validation runner', () => {
  it('pins both Prisma connection variables without inheriting provider credentials, hooks or PostgreSQL overrides', () => {
    const environment = isolatedPreparationEnvironment(inherited);
    expect(environment).toMatchObject({ DATABASE_URL: testUrl, DIRECT_URL: testUrl, NODE_ENV: 'test', GEMINI_API_KEY: '',
      PATH: inherited.Path, SYSTEMROOT: inherited.SystemRoot, TEMP: inherited.TEMP });
    expect(environment['DOTENV_CONFIG_PATH']).toBe(process.platform === 'win32' ? 'NUL' : '/dev/null');
    for (const key of ['NODE_OPTIONS', 'PGHOST', 'PGPASSWORD', 'PGOPTIONS', 'CLOUDINARY_API_SECRET', 'JWT_SECRET',
      'HERBALAI_TEST_DATABASE_URL', 'DOTENV_CONFIG_OVERRIDE']) expect(environment).not.toHaveProperty(key);
    expect(inherited.DIRECT_URL).toContain('example.invalid');
  });

  it('fails before any subprocess instead of falling back to DATABASE_URL or DIRECT_URL', () => {
    const execute = vi.fn();
    expect(() => runIsolatedPreparationTests({ DATABASE_URL: testUrl, DIRECT_URL: testUrl }, execute))
      .toThrow('Set HERBALAI_TEST_DATABASE_URL explicitly');
    expect(execute).not.toHaveBeenCalled();
  });

  it.each([
    '', 'not-a-url', 'https://test:test@localhost/herbalai_test',
    'postgresql://test:test@example.invalid/herbalai_test',
    'postgresql://test:test@127.0.0.1/neondb',
    'postgresql://test:test@127.0.0.1/herbalai_test/',
    'postgresql://test:test@127.0.0.1/%68erbalai_test',
    'postgresql://127.0.0.1/herbalai_test',
    'postgresql://test@127.0.0.1/herbalai_test',
    `${testUrl}&host=example.invalid`, `${testUrl}&password=synthetic`,
    `${testUrl}&options=-c%20search_path%3Dother`, `${testUrl}&sslmode=require`,
    `${testUrl}#fragment`,
  ])('rejects unsafe or ambiguous explicit target %s before migration', value => {
    const execute = vi.fn();
    expect(() => runIsolatedPreparationTests({ ...inherited, HERBALAI_TEST_DATABASE_URL: value }, execute)).toThrow();
    expect(execute).not.toHaveBeenCalled();
  });

  it.each(['localhost', '127.0.0.1', '[::1]'])('accepts the explicit test database on %s', host => {
    const value = `postgresql://test_user:test_password@${host}:5432/herbalai_test?sslmode=disable`;
    expect(isolatedPreparationEnvironment({ HERBALAI_TEST_DATABASE_URL: value })['DIRECT_URL']).toBe(value);
  });

  it('orders generation, migrations and only the eight-test preparation database suite', () => {
    const execute = vi.fn();
    expect(runIsolatedPreparationTests(inherited, execute)).toEqual([
      'Prisma client generation', 'Isolated schema migrations', 'Preparation PostgreSQL regressions',
    ]);
    expect(execute.mock.calls.map(call => call[0].args.slice(1))).toEqual([
      ['generate'], ['migrate', 'deploy'], ['run', 'tests/herb-preparation-update-database.test.ts', '--maxWorkers=1'],
    ]);
    for (const call of execute.mock.calls) {
      expect(call[1]['DATABASE_URL']).toBe(testUrl);
      expect(call[1]['DIRECT_URL']).toBe(testUrl);
      expect(call[2]).toBe(backendRoot);
    }
    expect(isolatedPreparationSteps().every(step => step.timeout > 0 && step.timeout <= 300000)).toBe(true);
  });

  it.each([0, 1, 2])('stops when stage %i fails and never claims later completion', failureIndex => {
    let currentIndex = 0;
    const execute = vi.fn(() => {
      if (currentIndex++ === failureIndex) throw new Error('Synthetic failure');
    });
    expect(() => runIsolatedPreparationTests(inherited, execute)).toThrow('Synthetic failure');
    expect(execute).toHaveBeenCalledTimes(failureIndex + 1);
  });

  it.each([
    { status: 1, signal: null, error: undefined },
    { status: null, signal: null, error: Object.assign(new Error('synthetic credential in child error'), { code: 'ETIMEDOUT' }) },
    { status: null, signal: 'SIGTERM' as const, error: undefined },
    { status: null, signal: null, error: undefined },
  ])('fails closed on subprocess failure, timeout or termination %#', failure => {
    vi.mocked(spawnSync).mockClear();
    const { error, ...outcome } = failure;
    vi.mocked(spawnSync).mockReturnValueOnce({ pid: 0, output: [], stdout: 'synthetic credential', stderr: 'synthetic credential',
      ...outcome, ...(error ? { error } : {}) });
    const write = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    try {
      expect(() => runIsolatedPreparationTests(inherited)).toThrow('Prisma client generation failed or timed out');
      expect(spawnSync).toHaveBeenCalledTimes(1);
      expect(spawnSync).toHaveBeenCalledWith(process.execPath, isolatedPreparationSteps()[0]!.args, expect.objectContaining({
        shell: false, windowsHide: true, timeout: 180000, cwd: backendRoot,
        env: expect.objectContaining({ DATABASE_URL: testUrl, DIRECT_URL: testUrl }),
      }));
      expect(write).toHaveBeenCalledWith('Running Prisma client generation...\n');
      expect(write.mock.calls.flat().join('')).not.toContain('synthetic');
    } finally { write.mockRestore(); }
  });

  it('does not carry a child-stage environment mutation into subsequent stages', () => {
    const execute = vi.fn((_step, environment) => {
      expect(environment['DIRECT_URL']).toBe(testUrl);
      environment['DIRECT_URL'] = inherited.DIRECT_URL;
    });
    runIsolatedPreparationTests(inherited, execute);
    expect(execute).toHaveBeenCalledTimes(3);
  });

  it('makes the existing Prisma config select loopback despite an inherited synthetic direct URL, without connecting', () => {
    const program = `const config = (await import('./prisma.config.ts')).default;
      const connection = new URL(config.datasource.url);
      process.stdout.write(JSON.stringify({host: connection.hostname, database: connection.pathname}));`;
    const result = spawnSync(process.execPath, ['--import', 'tsx', '--input-type=module', '-e', program], {
      cwd: backendRoot, env: isolatedPreparationEnvironment({ ...process.env, ...inherited }),
      encoding: 'utf8', shell: false, windowsHide: true, timeout: 20000,
    });
    expect(result.error).toBeUndefined();
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual({ host: '127.0.0.1', database: '/herbalai_test' });
  });

  it('CLI refuses provider-only variables without starting generation or printing the credential', () => {
    const environment = isolatedPreparationEnvironment({ ...process.env, ...inherited });
    environment['DATABASE_URL'] = inherited.DATABASE_URL;
    environment['DIRECT_URL'] = inherited.DIRECT_URL;
    const result = spawnSync(process.execPath, ['--import', 'tsx', path.join(backendRoot, 'prisma/test-herb-preparations.ts')], {
      cwd: backendRoot, env: environment, encoding: 'utf8', shell: false, windowsHide: true, timeout: 20000,
    });
    expect(result.status).toBe(1);
    expect(result.stdout).toBe('');
    expect(result.stderr).toContain('Set HERBALAI_TEST_DATABASE_URL explicitly');
    expect(result.stderr).not.toContain('synthetic');
    expect(result.stderr).not.toContain('example.invalid');
  });
});
