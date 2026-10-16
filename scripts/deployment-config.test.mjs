import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import ts from '../herbalaifrontend/node_modules/typescript/lib/typescript.js';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const dockerfile = read('herbalaifrontend/Dockerfile');
const compose = read('docker-compose.yml').split('  frontend:')[1];

const loadNextConfig = env => {
  const exports = {};
  const compiled = ts.transpileModule(read('herbalaifrontend/next.config.ts'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  new Function('exports', 'process', compiled)(exports, { env });
  return exports.default;
};

test('production enforces CSP while permitting the configured API and realtime endpoints', async () => {
  const config = loadNextConfig({ NODE_ENV: 'production', NEXT_PUBLIC_API_URL: 'https://api.example.test/api', NEXT_PUBLIC_SOCKET_URL: 'https://realtime.example.test' });
  const headers = (await config.headers())[0].headers;
  const policy = headers.find(header => header.key === 'Content-Security-Policy')?.value;
  assert.ok(policy);
  assert.match(policy, /connect-src 'self' https:\/\/api\.example\.test wss:\/\/api\.example\.test https:\/\/realtime\.example\.test wss:\/\/realtime\.example\.test;/);
  assert.match(policy, /script-src 'self' 'unsafe-inline';/);
  assert.doesNotMatch(policy, /unsafe-eval|connect-src[^;]*(?:https:|wss:)\s/);
  assert.match(policy, /object-src 'none';/);
  assert.match(policy, /frame-src 'none';/);
  assert.match(policy, /worker-src 'self' blob:;/);
  assert.match(policy, /form-action 'self'/);
  assert.equal(headers.some(header => header.key === 'Content-Security-Policy-Report-Only'), false);
});

test('CSP permits local development, same-origin APIs and normal Next development tooling', async () => {
  const config = loadNextConfig({ NODE_ENV: 'development', NEXT_PUBLIC_API_URL: '/api' });
  const policy = (await config.headers())[0].headers.find(header => header.key === 'Content-Security-Policy').value;
  assert.match(policy, /'unsafe-eval'/);
  assert.match(policy, /ws:\/\/localhost:\*/);
  assert.doesNotMatch(policy, /https:\/\/undefined/);
});

test('production rejects insecure remote and credential-bearing connection endpoints', () => {
  for (const endpoint of ['http://api.example.test/api', 'https://user:secret@api.example.test/api', 'javascript:alert(1)']) {
    assert.throws(() => loadNextConfig({ NODE_ENV: 'production', NEXT_PUBLIC_API_URL: endpoint }), /must use HTTPS/);
  }
});

test('CI schedules every native regression script', () => {
  const workflow = read('.github/workflows/ci.yml');
  const scheduled = [...workflow.matchAll(/node --test[^\r\n]*/g)].flatMap(command =>
    [...command[0].matchAll(/scripts\/([^\s]+\.test\.mjs)/g)].map(script => script[1]));
  const expected = readdirSync(new URL('./', import.meta.url)).filter(name => name.endsWith('.test.mjs'));
  assert.deepEqual(expected.filter(name => !scheduled.includes(name)).sort(), []);
});

test('public browser URLs are passed to the builder before Next build', () => {
  const builder = dockerfile.split('FROM base AS builder')[1].split('FROM base AS runner')[0];
  for (const name of ['NEXT_PUBLIC_API_URL', 'NEXT_PUBLIC_SOCKET_URL']) {
    assert.ok(builder.indexOf(`ARG ${name}=`) >= 0);
    assert.ok(builder.indexOf(`ENV ${name}=$${name}`) < builder.indexOf('RUN npm run build'));
    assert.ok(builder.includes(`ENV ${name}=$${name}`));
    assert.match(compose, new RegExp(`args:[\\s\\S]*${name}: \\$\\{${name}:\\?`));
    assert.ok(read('.env.example').includes(`${name}=`));
  }
});

test('runtime retains Next configuration for remote image handling', () => {
  const runner = dockerfile.split('FROM base AS runner')[1];
  assert.ok(runner.includes('COPY --from=builder /app/next.config.ts ./next.config.ts'));
});

test('CI strictly typechecks API and administrator fixtures and runs real vector rollback before the full suite', () => {
  const workflow = read('.github/workflows/ci.yml');
  const typecheck = workflow.indexOf('name: Typecheck API and administrator acceptance fixtures');
  const gate = workflow.indexOf('name: Run real administrator vector and audit rollback gate');
  const fullSuite = workflow.indexOf('name: Run isolated Vitest suites');
  assert.ok(typecheck > 0 && gate > typecheck && fullSuite > gate);
  assert.match(workflow.slice(typecheck, gate), /--strict[\s\S]*--exactOptionalPropertyTypes --noUncheckedIndexedAccess/);
  for (const fixture of ['api-security-boundaries', 'api-outage-forwarding', 'socket-security-boundaries', 'knowledge-import-atomicity', 'knowledge-import-database', 'knowledge-authenticated-flow', 'credits-config', 'credits-database']) {
    assert.ok(workflow.slice(typecheck, gate).includes(`tests/${fixture}.test.ts`));
  }
  const gateStep = workflow.slice(gate, fullSuite);
  for (const variable of ['DATABASE_URL', 'HERBALAI_TEST_DATABASE_URL']) {
    assert.match(gateStep, new RegExp(`${variable}: postgresql://test_user:test_password@127\\.0\\.0\\.1:5432/herbalai_test\\?sslmode=disable`));
  }
  assert.match(gateStep, /npx vitest run tests\/herb-admin-edit-database\.test\.ts tests\/knowledge-authenticated-flow\.test\.ts --maxWorkers=1/);
  assert.doesNotMatch(gateStep, /continue-on-error|\|\| true/);
  assert.match(workflow, /image: pgvector\/pgvector:pg16/);
});

test('deployment build context excludes environment-specific dotenv files', () => {
  const ignored = read('herbalaifrontend/.dockerignore').split(/\r?\n/);
  assert.ok(ignored.includes('.env'));
  assert.ok(ignored.includes('.env.*'));
});

const deploy = read('scripts/deploy.sh');
test('deployment fails closed and uses fast-forward updates', () => {
  assert.ok(deploy.includes('set -Eeuo pipefail'));
  assert.ok(deploy.includes('git pull --ff-only'));
  assert.ok(deploy.includes('git status --porcelain'));
  assert.ok(!deploy.includes('|| true'));
});
test('backup acknowledgement precedes deployment mutations', () => {
  assert.ok(deploy.indexOf('DEPLOY_BACKUP_CONFIRMED') < deploy.indexOf('git pull --ff-only'));
});
test('migration deployment precedes application replacement', () => {
  const build = deploy.indexOf('docker compose build backend frontend');
  const migration = deploy.indexOf('prisma migrate deploy');
  const start = deploy.indexOf('docker compose up -d --no-build backend frontend');
  assert.ok(build >= 0 && migration > build && start > migration);
  assert.ok(!deploy.includes('prisma db push'));
  assert.ok(read('herbalaibackend/Dockerfile').includes('COPY --from=builder /app/prisma.config.ts ./prisma.config.ts'));
});
test('health checks are bounded and rollback images are retained', () => {
  assert.ok(deploy.includes('for attempt in {1..30}'));
  assert.ok(deploy.includes('AbortSignal.timeout(3000)'));
  assert.ok(deploy.includes('if [[ "$healthy" != 1 ]]'));
  assert.ok(!deploy.includes('docker image prune'));
});
