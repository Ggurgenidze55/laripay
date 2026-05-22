#!/usr/bin/env bash
# LariPay.ai — ერთი ბრძანება: Next.js + ngrok + URL sync + health check
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "🚀 LariPay.ai starting..."
bash "$ROOT/scripts/dev-all.sh"
bash "$ROOT/scripts/health-check.sh" || true

PUBLIC=$(curl -s http://127.0.0.1:4040/api/tunnels 2>/dev/null \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(next((t['public_url'] for t in d.get('tunnels',[]) if t.get('public_url','').startswith('https')), ''))" 2>/dev/null || true)

echo ""
echo "✅ LariPay.ai მუშაობს"
echo "   Site:     ${PUBLIC}/laripay"
echo "   Dashboard:${PUBLIC}/laripay/dashboard"
echo "   Demo:     ${PUBLIC}/demo"
echo "   API setup:${PUBLIC}/api/laripay/setup"
echo "   Webhook:  ${PUBLIC}/api/webhook"
echo ""
echo "Shopify (ერთჯერად, თუ გინდა checkout):"
echo "   cd integrations/shopify/georgia-pay-app"
echo "   npx shopify auth login && npm run shopify:link && npm run shopify:dev"
