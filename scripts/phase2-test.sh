#!/usr/bin/env bash
# LariPay.ai ფაზა 2 — API + portal tests
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP="$ROOT/integrations/shopify/georgia-pay-app"

if [[ -f "$APP/.env" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$APP/.env"
  set +a
fi

# LARIPAY_TEST_HOST overrides .env HOST (e.g. Docker on :3001)
HOST="${LARIPAY_TEST_HOST:-${HOST:-http://localhost:3000}}"
HOST="${HOST%/}"
KEY="${LARIPAY_DEMO_API_KEY:-${PAYKA_DEMO_API_KEY:-}}"
ADMIN="${LARIPAY_ADMIN_SECRET:-${PAYKA_ADMIN_SECRET:-}}"
CURL_HDR=(-s -H "ngrok-skip-browser-warning: true")

pass() { echo "  ✅ $1"; }
fail() { echo "  ❌ $1"; FAIL=1; }

FAIL=0
echo ""
echo "LariPay.ai Phase 2 Test — $HOST"
echo "========================================"

echo ""
echo "Health"
code=$(curl "${CURL_HDR[@]}" -o /tmp/laripay-health.json -w "%{http_code}" "$HOST/api/health" || echo "000")
if [[ "$code" == "200" ]] && grep -q '"status":"healthy"' /tmp/laripay-health.json 2>/dev/null; then
  pass "/api/health"
else
  fail "/api/health ($code)"
fi

if [[ -z "$KEY" ]]; then
  fail "LARIPAY_DEMO_API_KEY missing — skip API tests"
else
  echo ""
  echo "Portal login + dashboard"
  curl "${CURL_HDR[@]}" -c /tmp/laripay-cookies.txt -X POST \
    -H "Authorization: Bearer $KEY" "$HOST/api/laripay/portal/login" >/tmp/laripay-login.json
  if grep -q '"slug"' /tmp/laripay-login.json 2>/dev/null; then
    pass "POST /api/laripay/portal/login"
  else
    fail "POST /api/laripay/portal/login"
  fi

  dash=$(curl "${CURL_HDR[@]}" -b /tmp/laripay-cookies.txt "$HOST/api/laripay/dashboard")
  if echo "$dash" | grep -q '"recent_payments"'; then
    pass "GET /api/laripay/dashboard (authenticated)"
  else
    fail "GET /api/laripay/dashboard"
  fi

  echo ""
  echo "Checkout idempotency"
  IDEM="phase2-$(date +%s)"
  b1=$(curl "${CURL_HDR[@]}" -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \
    -H "Idempotency-Key: $IDEM" \
    -d "{\"amount\":1.5,\"provider\":\"tbc\",\"success_url\":\"$HOST/demo\",\"cancel_url\":\"$HOST/demo\"}" \
    "$HOST/api/v1/checkout/sessions")
  b2=$(curl "${CURL_HDR[@]}" -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \
    -H "Idempotency-Key: $IDEM" \
    -d "{\"amount\":1.5,\"provider\":\"tbc\",\"success_url\":\"$HOST/demo\",\"cancel_url\":\"$HOST/demo\"}" \
    "$HOST/api/v1/checkout/sessions")
  id1=$(echo "$b1" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null || true)
  id2=$(echo "$b2" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null || true)
  if [[ -n "$id1" && "$id1" == "$id2" ]]; then
    pass "Idempotency-Key returns same session"
  elif echo "$b1" | grep -qE 'TBC not configured|CLIENT_ID'; then
    echo "  ⚠️  Checkout skipped — TBC merchant keys missing (ფაზა 1)"
  else
    fail "Idempotency-Key"
  fi
fi

echo ""
echo "Signup"
uid="phase2-$(date +%s)-$RANDOM"
email="${uid}@laripay.ai"
sig_code=$(curl "${CURL_HDR[@]}" -o /tmp/laripay-signup.json -w "%{http_code}" -H "Content-Type: application/json" \
  -d "{\"name\":\"$uid\",\"email\":\"$email\",\"slug\":\"$uid\"}" "$HOST/api/laripay/signup")
if [[ "$sig_code" == "201" ]] && grep -q 'sk_test_' /tmp/laripay-signup.json 2>/dev/null; then
  pass "POST /api/laripay/signup (enabled)"
elif [[ "$sig_code" == "403" ]]; then
  pass "Signup disabled on server (403 — OK for production Docker)"
else
  fail "POST /api/laripay/signup ($sig_code)"
fi

if [[ -n "$ADMIN" ]]; then
  echo ""
  echo "Admin"
  curl "${CURL_HDR[@]}" -s "$HOST/api/laripay/setup" >/dev/null || true
  wh=$(curl "${CURL_HDR[@]}" -H "x-laripay-admin-secret: $ADMIN" -H "Content-Type: application/json" \
    -d '{"url":"https://example.com/webhook","events":["*"]}' \
    "$HOST/api/laripay/merchants/demo-merchant/webhooks" 2>/dev/null || true)
  if echo "$wh" | grep -q '"url"'; then
    pass "POST merchant webhooks (admin)"
  else
    fail "Admin webhooks — $(echo "$wh" | head -c 120)"
  fi
else
  echo "  ⚠️  Admin tests skipped (no LARIPAY_ADMIN_SECRET)"
fi

echo ""
if [[ "$FAIL" -eq 0 ]]; then
  echo "✅ Phase 2 PASS"
else
  echo "❌ Phase 2 INCOMPLETE"
fi
echo ""
exit "$FAIL"
