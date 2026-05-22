#!/usr/bin/env bash
# LariPay.ai ფაზა 1 — სრული ტესტის სკრიპტი
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP="$ROOT/integrations/shopify/georgia-pay-app"

if [[ -f "$APP/.env" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$APP/.env"
  set +a
fi

HOST="${HOST:-http://localhost:3000}"
HOST="${HOST%/}"
KEY="${LARIPAY_DEMO_API_KEY:-${PAYKA_DEMO_API_KEY:-}}"
CURL_HDR=(-s -H "ngrok-skip-browser-warning: true")

pass() { echo "  ✅ $1"; }
fail() { echo "  ❌ $1"; FAIL=1; }
warn() { echo "  ⚠️  $1"; }

FAIL=0
echo ""
echo "LariPay.ai Phase 1 Test — $HOST"
echo "========================================"

# SDK
echo ""
echo "SDK smoke test"
if node "$ROOT/examples/smoke-test.cjs" >/dev/null 2>&1; then
  pass "GeorgianPayments SDK"
else
  fail "GeorgianPayments SDK"
fi

# HTTP
echo ""
echo "HTTP endpoints"
for path in "/" "/laripay" "/demo" "/api/laripay/setup"; do
  code=$(curl "${CURL_HDR[@]}" -o /dev/null -w "%{http_code}" "$HOST$path" || echo "000")
  if [[ "$code" =~ ^(200|307)$ ]]; then
    pass "$path ($code)"
  else
    fail "$path ($code)"
  fi
done

# Env
echo ""
echo "Environment"
[[ -n "${LARIPAY_DEMO_API_KEY:-}" ]] && pass "LARIPAY_DEMO_API_KEY" || fail "LARIPAY_DEMO_API_KEY missing"
[[ -n "${TBC_API_KEY:-}" ]] && pass "TBC_API_KEY (developer)" || fail "TBC_API_KEY missing"
if [[ -n "${TBC_CLIENT_ID:-}" && -n "${TBC_CLIENT_SECRET:-}" ]]; then
  pass "TBC_CLIENT_ID + TBC_CLIENT_SECRET (e-commerce merchant)"
else
  fail "TBC merchant credentials — დაამატე ecom.tbcpayments.ge-დან, restart npm start"
fi

# API
echo ""
echo "LariPay.ai API"
if [[ -z "$KEY" ]]; then
  fail "Cannot test API without LARIPAY_DEMO_API_KEY"
else
  bal=$(curl "${CURL_HDR[@]}" -H "Authorization: Bearer $KEY" "$HOST/api/v1/balance")
  if echo "$bal" | grep -q '"object":"balance"'; then
    pass "GET /api/v1/balance"
  else
    fail "GET /api/v1/balance"
  fi

  chk=$(curl "${CURL_HDR[@]}" -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \
    -d "{\"amount\":2,\"provider\":\"tbc\",\"success_url\":\"$HOST/laripay/dashboard\",\"cancel_url\":\"$HOST/demo\"}" \
    "$HOST/api/v1/checkout/sessions")
  if echo "$chk" | grep -q '"url"'; then
    pass "POST /api/v1/checkout/sessions → bank redirect URL"
  elif echo "$chk" | grep -q 'TBC not configured'; then
    fail "Checkout — TBC merchant CLIENT_ID/SECRET საჭიროა .env-ში"
  else
    fail "Checkout — $(echo "$chk" | python3 -c "import sys,json; print(json.load(sys.stdin).get('error',{}).get('message','unknown'))" 2>/dev/null || echo "$chk")"
  fi
fi

# TBC direct
echo ""
echo "TBC bank API (direct)"
if [[ -n "${TBC_CLIENT_ID:-}" && -n "${TBC_CLIENT_SECRET:-}" && -n "${TBC_API_KEY:-}" ]]; then
  if (cd "$ROOT" && TBC_ENV=sandbox TBC_API_KEY="$TBC_API_KEY" TBC_CLIENT_ID="$TBC_CLIENT_ID" TBC_CLIENT_SECRET="$TBC_CLIENT_SECRET" \
    node -e "
const { GeorgianPayments } = require('./src/georgian-payments.cjs');
const p = new GeorgianPayments({ tbcClientId: process.env.TBC_CLIENT_ID, tbcSecret: process.env.TBC_CLIENT_SECRET, tbcApiKey: process.env.TBC_API_KEY });
p.createPayment(1,'GEL','phase1-'+Date.now(), process.env.HOST+'/payment/return', { provider:'tbc', callbackUrl: process.env.HOST+'/api/webhook' })
  .then(r => { if (r.redirectUrl) process.exit(0); process.exit(1); })
  .catch(() => process.exit(1));
" HOST="$HOST"); then
    pass "TBC createPayment → redirect URL"
  else
    fail "TBC createPayment — შეამოწმე credentials ან ბანკის dashboard URLs"
  fi
else
  warn "TBC direct test skipped (no merchant creds)"
fi

echo ""
echo "========================================"
if [[ "$FAIL" -eq 0 ]]; then
  echo "✅ Phase 1 PASS — გახსენი $HOST/demo და დაასრულე გადახდა ბრაუზერში"
else
  echo "❌ Phase 1 INCOMPLETE — გამოასწორე ზემოთ მონიშნული"
  echo ""
  echo "ბოლო ნაბიჯი: ecom.tbcpayments.ge → Client ID + Secret → .env → npm start"
fi
echo ""
exit "$FAIL"
