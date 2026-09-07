#!/usr/bin/env bash
# Herbal AI guarded deployment. This is not a zero-downtime deployment.
set -Eeuo pipefail
trap 'echo "Deployment failed at line $LINENO. No automatic rollback or image pruning was performed; review logs and the deployment guide." >&2' ERR

PROJECT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd -- "$PROJECT_DIR"
command -v git >/dev/null
command -v docker >/dev/null
docker compose version >/dev/null

checkout_status="$(git status --porcelain)"
if [[ -n "$checkout_status" ]]; then
    echo 'Refusing deployment from a dirty checkout. Review and commit the intended release first.' >&2
    exit 1
fi
if [[ "${DEPLOY_BACKUP_CONFIRMED:-}" != 'yes' ]]; then
    echo 'Verify a database backup/restore procedure and record the previous image IDs and git commit. Then set DEPLOY_BACKUP_CONFIRMED=yes.' >&2
    exit 1
fi

echo '--> Updating the current branch from its configured upstream (fast-forward only)...'
git pull --ff-only
docker compose config --quiet
echo '--> Building application images before changing running application containers...'
docker compose build backend frontend
echo '--> Waiting for PostgreSQL...'
docker compose up -d --wait --wait-timeout 90 postgres
echo '--> Applying versioned migrations using the new backend image...'
docker compose run --rm --no-deps backend npx --no-install prisma migrate deploy
docker compose run --rm --no-deps backend npx --no-install prisma migrate status
echo '--> Starting application containers...'
docker compose up -d --no-build backend frontend

echo '--> Checking application responses inside their containers...'
healthy=0
for attempt in {1..30}; do
    if docker compose exec -T backend node -e 'fetch("http://127.0.0.1:5000/api/health", {signal: AbortSignal.timeout(3000)}).then(async r => {if (!r.ok || (await r.json()).status !== "success") throw new Error("API not healthy")}).catch(() => process.exit(1))' &&
       docker compose exec -T frontend node -e 'fetch("http://127.0.0.1:3000", {signal: AbortSignal.timeout(3000)}).then(async r => {if (!r.ok || !(await r.text()).includes("<title>Herbal AI")) throw new Error("Frontend not healthy")}).catch(() => process.exit(1))'; then
        healthy=1
        break
    fi
    sleep 2
done
if [[ "$healthy" != 1 ]]; then
    echo 'Application checks failed. Inspect docker compose logs; do not declare the release ready.' >&2
    exit 1
fi
echo '--> Internal application checks passed. Public HTTPS, OAuth, email and browser smoke tests are still required.'
docker compose ps
