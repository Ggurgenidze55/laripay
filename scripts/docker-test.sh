#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOST="${LARIPAY_DOCKER_HOST:-http://localhost:3002}"

echo "Docker LariPay.ai test — $HOST"
code=$(curl -s -o /tmp/docker-health.json -w "%{http_code}" "$HOST/api/health" || echo "000")
if [[ "$code" == "200" ]] && grep -q healthy /tmp/docker-health.json; then
  echo "✅ /api/health ($code)"
  cat /tmp/docker-health.json
  echo ""
  exit 0
fi
echo "❌ /api/health failed ($code) — run: npm run docker:up"
exit 1
