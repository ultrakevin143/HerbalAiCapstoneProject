import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validatePreparationConnectionUrl } from '../src/content/herb-preparation-update.js';

const backendRoot = fileURLToPath(new URL('../', import.meta.url));
const runtimeKeys = ['PATH', 'PATHEXT', 'SYSTEMROOT', 'COMSPEC', 'WINDIR', 'TEMP', 'TMP', 'TMPDIR',
  'HOME', 'USERPROFILE', 'APPDATA', 'LOCALAPPDATA', 'LANG', 'LC_ALL'];

export const isolatedPreparationEnvironment = (inherited: NodeJS.ProcessEnv): NodeJS.ProcessEnv => {
  const rawUrl = inherited['HERBALAI_TEST_DATABASE_URL'];
  if (!rawUrl) throw new Error('Set HERBALAI_TEST_DATABASE_URL explicitly; existing database variables are never a test fallback.');
  const connection = validatePreparationConnectionUrl(rawUrl);
  if (!['localhost', '127.0.0.1', '[::1]'].includes(connection.hostname)
    || connection.pathname !== '/herbalai_test' || !connection.username || !connection.password) {
    throw new Error('Preparation tests require an explicit loopback herbalai_test database with test credentials.');
  }
  const environment: NodeJS.ProcessEnv = {};
  for (const key of runtimeKeys) {
    const matchingKey = Object.keys(inherited).find(candidate => candidate.toUpperCase() === key);
    if (matchingKey && inherited[matchingKey] !== undefined) environment[key] = inherited[matchingKey];
  }
  environment['DATABASE_URL'] = connection.toString();
  environment['DIRECT_URL'] = connection.toString();
  environment['NODE_ENV'] = 'test';
  environment['GEMINI_API_KEY'] = '';
  environment['DOTENV_CONFIG_PATH'] = process.platform === 'win32' ? 'NUL' : '/dev/null';
  return environment;
};

export interface IsolatedPreparationStep {
  label: string;
  args: string[];
  timeout: number;
}

export const isolatedPreparationSteps = (): IsolatedPreparationStep[] => [
  { label: 'Prisma client generation', args: [path.join(backendRoot, 'node_modules/prisma/build/index.js'), 'generate'], timeout: 180000 },
  { label: 'Isolated schema migrations', args: [path.join(backendRoot, 'node_modules/prisma/build/index.js'), 'migrate', 'deploy'], timeout: 180000 },
  { label: 'Preparation PostgreSQL regressions', args: [path.join(backendRoot, 'node_modules/vitest/vitest.mjs'), 'run',
    'tests/herb-preparation-update-database.test.ts', '--maxWorkers=1'], timeout: 300000 },
];

type Executor = (step: IsolatedPreparationStep, environment: NodeJS.ProcessEnv, cwd: string) => void;

export const executeIsolatedPreparationStep: Executor = (step, environment, cwd) => {
  process.stdout.write(`Running ${step.label}...\n`);
  const result = spawnSync(process.execPath, step.args, {
    cwd, env: environment, shell: false, windowsHide: true, timeout: step.timeout,
    encoding: 'utf8', maxBuffer: 8 * 1024 * 1024,
  });
  if (result.error || result.signal || result.status !== 0) {
    throw new Error(`${step.label} failed or timed out; later stages were not run. Child output is withheld to avoid exposing credentials.`);
  }
};

export const runIsolatedPreparationTests = (inherited: NodeJS.ProcessEnv, execute: Executor = executeIsolatedPreparationStep): string[] => {
  const environment = isolatedPreparationEnvironment(inherited);
  const completed: string[] = [];
  for (const step of isolatedPreparationSteps()) {
    execute(step, { ...environment }, backendRoot);
    completed.push(step.label);
  }
  return completed;
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const completed = runIsolatedPreparationTests(process.env);
    process.stdout.write(`Completed ${completed.length} isolated preparation validation stages. No provider database was selected.\n`);
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : 'Isolated preparation validation failed.'}\n`);
    process.exitCode = 1;
  }
}
