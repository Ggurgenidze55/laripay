#!/usr/bin/env bash
# Shopify app link — გაუშვი მხოლოდ თუ Partners-ში უკვე შექმნილი გაქვს აპი
set -euo pipefail
cd "$(dirname "$0")/.."

export PATH="$(pwd)/node_modules/.bin:$PATH"

echo "Shopify CLI: $(npx shopify version)"

if [[ -n "${SHOPIFY_CLIENT_ID:-}" ]]; then
  echo "Linking with SHOPIFY_CLIENT_ID..."
  npx shopify app config link --client-id="$SHOPIFY_CLIENT_ID"
else
  echo "Opening interactive link (აირჩიე აპი Partners-ში)..."
  npx shopify app config link
fi

CLIENT_ID=$(grep '^client_id' shopify.app.toml | cut -d'"' -f2)
if [[ "$CLIENT_ID" != "YOUR_CLIENT_ID" && -n "$CLIENT_ID" ]]; then
  grep -q '^SHOPIFY_API_KEY=' .env 2>/dev/null || echo "SHOPIFY_API_KEY=" >>.env
  grep -q '^NEXT_PUBLIC_SHOPIFY_API_KEY=' .env 2>/dev/null || echo "NEXT_PUBLIC_SHOPIFY_API_KEY=" >>.env
  if [[ "$(uname)" == "Darwin" ]]; then
    sed -i '' "s|^SHOPIFY_API_KEY=.*|SHOPIFY_API_KEY=${CLIENT_ID}|" .env
    sed -i '' "s|^NEXT_PUBLIC_SHOPIFY_API_KEY=.*|NEXT_PUBLIC_SHOPIFY_API_KEY=${CLIENT_ID}|" .env
  fi
  echo "✅ client_id → .env: $CLIENT_ID"
  echo "დაამატე SHOPIFY_API_SECRET Partners dashboard → App setup → Client credentials"
fi
