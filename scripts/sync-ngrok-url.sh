#!/usr/bin/env bash
# Sync LariPay.ai / Shopify config from ngrok (http://127.0.0.1:4040)
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")/../integrations/shopify/georgia-pay-app" && pwd)"
cd "$APP_DIR"

echo "Fetching ngrok public URL from http://127.0.0.1:4040/api/tunnels ..."

PUBLIC_URL=""
for i in {1..30}; do
  PUBLIC_URL=$(curl -s http://127.0.0.1:4040/api/tunnels 2>/dev/null \
    | python3 -c "import sys,json; d=json.load(sys.stdin); ts=d.get('tunnels',[]); print(next((t['public_url'] for t in ts if t.get('public_url','').startswith('https')), ''))" 2>/dev/null || true)
  if [[ -n "$PUBLIC_URL" ]]; then
    break
  fi
  sleep 1
done

if [[ -z "$PUBLIC_URL" ]]; then
  echo "ERROR: ngrok tunnel not found. Run: ngrok http 3000"
  exit 1
fi

echo "Using tunnel: $PUBLIC_URL"

update_env() {
  local file="$1"
  touch "$file"
  for key in HOST LARIPAY_RETURN_URL LARIPAY_WEBHOOK_URL PAYKA_RETURN_URL PAYKA_WEBHOOK_URL NEXT_PUBLIC_HOST; do
    if grep -q "^${key}=" "$file" 2>/dev/null; then
      :
    else
      echo "${key}=" >> "$file"
    fi
  done
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s|^HOST=.*|HOST=${PUBLIC_URL}|" "$file"
    sed -i '' "s|^LARIPAY_RETURN_URL=.*|LARIPAY_RETURN_URL=${PUBLIC_URL}/payment/return|" "$file"
    sed -i '' "s|^LARIPAY_WEBHOOK_URL=.*|LARIPAY_WEBHOOK_URL=${PUBLIC_URL}/api/webhook|" "$file"
    sed -i '' "s|^PAYKA_RETURN_URL=.*|PAYKA_RETURN_URL=${PUBLIC_URL}/payment/return|" "$file"
    sed -i '' "s|^PAYKA_WEBHOOK_URL=.*|PAYKA_WEBHOOK_URL=${PUBLIC_URL}/api/webhook|" "$file"
    sed -i '' "s|^NEXT_PUBLIC_HOST=.*|NEXT_PUBLIC_HOST=${PUBLIC_URL}|" "$file"
  else
    sed -i "s|^HOST=.*|HOST=${PUBLIC_URL}|" "$file"
    sed -i "s|^LARIPAY_RETURN_URL=.*|LARIPAY_RETURN_URL=${PUBLIC_URL}/payment/return|" "$file"
    sed -i "s|^LARIPAY_WEBHOOK_URL=.*|LARIPAY_WEBHOOK_URL=${PUBLIC_URL}/api/webhook|" "$file"
    sed -i "s|^PAYKA_RETURN_URL=.*|PAYKA_RETURN_URL=${PUBLIC_URL}/payment/return|" "$file"
    sed -i "s|^PAYKA_WEBHOOK_URL=.*|PAYKA_WEBHOOK_URL=${PUBLIC_URL}/api/webhook|" "$file"
    sed -i "s|^NEXT_PUBLIC_HOST=.*|NEXT_PUBLIC_HOST=${PUBLIC_URL}|" "$file"
  fi
}

update_env "$APP_DIR/.env"

# shopify.app.toml (macOS + Linux)
if [[ "$OSTYPE" == "darwin"* ]]; then
  SED_INPLACE=(-i '')
else
  SED_INPLACE=(-i)
fi
sed "${SED_INPLACE[@]}" "s|application_url = \".*\"|application_url = \"${PUBLIC_URL}\"|" shopify.app.toml
sed "${SED_INPLACE[@]}" "s|\"https://[^\"]*\/api/auth/callback\"|\"${PUBLIC_URL}/api/auth/callback\"|" shopify.app.toml
sed "${SED_INPLACE[@]}" "s|payment_session_url = \".*\"|payment_session_url = \"${PUBLIC_URL}/api/payment_session\"|" extensions/georgia-pay-offsite/shopify.extension.toml
sed "${SED_INPLACE[@]}" "s|refund_session_url = \".*\"|refund_session_url = \"${PUBLIC_URL}/api/refund_session\"|" extensions/georgia-pay-offsite/shopify.extension.toml

echo ""
echo "Updated:"
echo "  HOST=$PUBLIC_URL"
echo "  LARIPAY_RETURN_URL=${PUBLIC_URL}/payment/return"
echo "  LARIPAY_WEBHOOK_URL=${PUBLIC_URL}/api/webhook"
echo ""
echo "Restart npm run dev if it was already running."
