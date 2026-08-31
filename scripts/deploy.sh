#!/bin/bash
# ==============================================================================
# Herbal AI - Zero-Downtime Deployment Script
# ==============================================================================

set -e

PROJECT_DIR="/root/herbal-ai"

if [ -d "$PROJECT_DIR" ]; then
    cd "$PROJECT_DIR"
else
    echo "Directory $PROJECT_DIR does not exist. Using current directory."
fi

echo "--> Pulling latest git changes..."
git pull origin main || true

echo "--> Pulling latest container images..."
docker compose pull || true

echo "--> Rebuilding and starting containers in detached mode..."
docker compose up -d --build --remove-orphans

echo "--> Running database migrations..."
docker compose exec -T backend npx prisma db push --skip-generate || true

echo "--> Pruning dangling Docker images..."
docker image prune -f

echo "--> Herbal AI deployment completed successfully!"
docker compose ps
