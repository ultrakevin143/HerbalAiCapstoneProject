import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const dockerfile = read('herbalaifrontend/Dockerfile');
const compose = read('docker-compose.yml').split('  frontend:')[1];

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
