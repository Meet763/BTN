#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Avoid overlapping runs if an image pull takes longer than the timer interval.
exec 9>/tmp/btn-deploy.lock
flock -n 9 || exit 0

cd "$APP_DIR"
git pull --ff-only origin alpha
docker-compose pull
docker-compose up -d --no-build
