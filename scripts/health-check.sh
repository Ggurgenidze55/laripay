#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")/../integrations/shopify/georgia-pay-app" && pwd)"
source "$APP_DIR/.env" 2>/dev/null || true

HOST="${HOST:-http://localhost:3000}"
HOST="${HOST%/}"

echo "Health check: $HOST"

check() {
  local path="$1"
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" "$HOST$path" || echo "000")
  if [[ "$code" =~ ^(200|201|302|307)$ ]]; then
    echo "  OK  $path ($code)"
  else
    echo "  FAIL $path ($code)"
    return 1
  fi
}

check "/"
check "/laripay"
check "/api/laripay/setup"
check "/demo"

code=$(curl -s -o /dev/null -w "%{http_code}" "$HOST/api/health" || echo "000")
if [[ "$code" == "200" ]]; then
  echo "  OK  /api/health ($code)"
else
  echo "  FAIL /api/health ($code)"
fi

DEMO_KEY="${LARIPAY_DEMO_API_KEY:-${PAYKA_DEMO_API_KEY:-}}"
if [[ -n "$DEMO_KEY" ]]; then
  bal=$(curl -s -H "Authorization: Bearer $DEMO_KEY" "$HOST/api/v1/balance")
  if echo "$bal" | grep -q '"object":"balance"'; then
    echo "  OK  /api/v1/balance (auth)"
  else
    echo "  FAIL /api/v1/balance"
  fi
fi

echo "Done."
