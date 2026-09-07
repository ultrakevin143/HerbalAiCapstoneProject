import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const bash = process.env.TEST_BASH || (process.platform === 'win32'
  ? `${process.env.LOCALAPPDATA}/Programs/Git/bin/bash.exe` : '/bin/bash');
const script = fileURLToPath(new URL('./deploy.sh', import.meta.url)).replaceAll('\\', '/');
// Functions shadow all external commands the deployment invokes. Nothing deploys.
const harness = `
git() {
  echo "MOCK git $*" >&2
  if [[ "$1" == status ]]; then
    [[ "$SCENARIO" == status_failure ]] && return 1
    [[ "$SCENARIO" == dirty ]] && echo changed
  fi
  [[ "$SCENARIO" == pull_failure && "$1" == pull ]] && return 1
  return 0
}
docker() {
  echo "MOCK docker $*" >&2
  [[ "$SCENARIO" == build_failure && "$*" == *"compose build"* ]] && return 1
  [[ "$SCENARIO" == migration_failure && "$*" == *"prisma migrate deploy"* ]] && return 1
  [[ "$SCENARIO" == health_failure && "$*" == *"compose exec"* ]] && return 1
  return 0
}
sleep() { :; }
source "$1"
`;

for (const scenario of ['dirty', 'status_failure', 'backup_missing', 'pull_failure', 'build_failure', 'migration_failure', 'health_failure', 'success']) {
  test(`guarded deployment: ${scenario} (mock commands)`, { skip: !existsSync(bash) }, () => {
    const result = spawnSync(bash, ['--noprofile', '--norc', '-c', harness, 'deployment-test', script], {
      encoding: 'utf8', timeout: 10000,
      env: { ...process.env, SCENARIO: scenario, DEPLOY_BACKUP_CONFIRMED: scenario === 'backup_missing' ? '' : 'yes' },
    });
    assert.ifError(result.error);
    const output = result.stdout + result.stderr;
    assert.equal(result.status === 0, scenario === 'success', output);
    if (['dirty', 'status_failure', 'backup_missing'].includes(scenario)) assert.ok(!output.includes('MOCK git pull'), output);
    if (scenario === 'pull_failure') assert.ok(!output.includes('MOCK docker compose build'), output);
    if (scenario === 'build_failure') assert.ok(!output.includes('MOCK docker compose up'), output);
    if (scenario === 'migration_failure') assert.ok(!output.includes('MOCK docker compose up -d --no-build'), output);
    if (scenario === 'health_failure') assert.equal((output.match(/MOCK docker compose exec/g) || []).length, 30);
    assert.equal(output.includes('--> Internal application checks passed.'), scenario === 'success');
  });
}
