#!/usr/bin/env bash
# LariPay.ai dev stack: Next.js + ngrok + URL sync
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP="$ROOT/integrations/shopify/georgia-pay-app"
LOG_DIR="${TMPDIR:-/tmp}/laripay-logs"
mkdir -p "$LOG_DIR"

port_in_use() { lsof -i ":$1" >/dev/null 2>&1; }

echo "==> LariPay.ai dev stack"

# 1. Prisma
if [[ ! -f "$APP/prisma/dev.db" ]]; then
  echo "==> Initializing SQLite..."
  (cd "$APP" && DATABASE_URL="file:./dev.db" npx prisma db push --skip-generate 2>/dev/null || npx prisma db push)
fi

# 2. Next.js
if port_in_use 3000; then
  echo "==> Next.js already on :3000"
else
  echo "==> Starting Next.js..."
  (cd "$APP" && npm run dev >>"$LOG_DIR/next.log" 2>&1 &)
  for i in {1..40}; do
    curl -sf http://localhost:3000/ >/dev/null 2>&1 && break
    sleep 0.5
  done
fi

# 3. ngrok
if curl -sf http://127.0.0.1:4040/api/tunnels >/dev/null 2>&1; then
  echo "==> ngrok already running"
else
  if ! ngrok config check >/dev/null 2>&1; then
    echo "ERROR: ngrok authtoken not configured."
    echo "  ngrok config add-authtoken YOUR_TOKEN"
    exit 1
  fi
  echo "==> Starting ngrok http 3000..."
  ngrok http 3000 --log=stdout >>"$LOG_DIR/ngrok.log" 2>&1 &
  sleep 3
fi

# 4. Sync URLs
bash "$ROOT/scripts/sync-ngrok-url.sh"

PUBLIC_URL=$(curl -s http://127.0.0.1:4040/api/tunnels 2>/dev/null \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(next((t['public_url'] for t in d.get('tunnels',[]) if t.get('public_url','').startswith('https')), ''))" 2>/dev/null || true)

# NEXT_PUBLIC for admin UI
if [[ -n "$PUBLIC_URL" && -f "$APP/.env" ]]; then
  if grep -q '^NEXT_PUBLIC_HOST=' "$APP/.env" 2>/dev/null; then
    [[ "$OSTYPE" == "darwin"* ]] && sed -i '' "s|^NEXT_PUBLIC_HOST=.*|NEXT_PUBLIC_HOST=${PUBLIC_URL}|" "$APP/.env" \
      || sed -i "s|^NEXT_PUBLIC_HOST=.*|NEXT_PUBLIC_HOST=${PUBLIC_URL}|" "$APP/.env"
  else
    echo "NEXT_PUBLIC_HOST=${PUBLIC_URL}" >>"$APP/.env"
  fi
fi

echo ""
echo "=========================================="
echo "  Local:    http://localhost:3000"
echo "  Public:   ${PUBLIC_URL:-<start ngrok>}"
echo "  ngrok UI: http://127.0.0.1:4040"
echo "  Return:   ${PUBLIC_URL}/payment/return"
echo "  Webhook:  ${PUBLIC_URL}/api/webhook"
echo "  Shopify:  cd integrations/shopify/georgia-pay-app && shopify app dev"
echo "=========================================="
echo "Logs: $LOG_DIR"
