#!/usr/bin/env bash
# Works from repo root OR when Vercel Root Directory = integrations/shopify/georgia-pay-app
set -euo pipefail

action="${1:-build}"
repo_root="$(cd "$(dirname "$0")/.." && pwd)"
app_rel="integrations/shopify/georgia-pay-app"

if [ -f package.json ] && grep -q '"georgia-pay-shopify"' package.json 2>/dev/null; then
  app_dir="$(pwd)"
else
  app_dir="${repo_root}/${app_rel}"
fi

cd "$app_dir"
echo "[vercel-app] cwd=$(pwd) action=${action}"

case "$action" in
  install)
    npm install
    ;;
  build)
    export VERCEL=1
    npm install
    npm run build:vercel
    ;;
  *)
    echo "Usage: vercel-app.sh {install|build}" >&2
    exit 1
    ;;
esac
