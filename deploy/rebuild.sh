#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ ! -f .env ]]; then
  echo "Copy .env.example to .env and set passwords first."
  exit 1
fi

docker compose up -d --build
docker compose ps
echo "App is on http://localhost:${WEB_PORT:-8080}"
