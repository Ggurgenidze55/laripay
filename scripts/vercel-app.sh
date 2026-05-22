#!/usr/bin/env bash
# Monorepo: build Next app in integrations/shopify/georgia-pay-app; sync .next to repo root when needed.
set -euo pipefail

action="${1:-build}"
repo_root="$(cd "$(dirname "$0")/.." && pwd)"
app_rel="integrations/shopify/georgia-pay-app"
app_dir="${repo_root}/${app_rel}"

# Vercel Root Directory = georgia-pay-app
if [ -f package.json ] && grep -q '"georgia-pay-shopify"' package.json 2>/dev/null; then
  app_dir="$(pwd)"
  in_app_root=1
else
  in_app_root=0
fi

cd "$app_dir"
echo "[vercel-app] cwd=$(pwd) action=${action} in_app_root=${in_app_root}"

case "$action" in
  install)
    if [ "$in_app_root" = "0" ]; then
      echo "[vercel-app] npm install at repo root (Next.js detection)"
      (cd "$repo_root" && npm install --no-audit --no-fund)
    fi
    NPM_CONFIG_PRODUCTION=false npm install --no-audit --no-fund --include=dev
    ;;
  build)
    export VERCEL=1
    export NPM_CONFIG_PRODUCTION=false
    npm install --no-audit --no-fund --include=dev
    npm run build:vercel
    if [ "$in_app_root" = "0" ]; then
      echo "[vercel-app] sync .next and public to repo root for Vercel"
      rm -rf "${repo_root}/.next" "${repo_root}/public"
      cp -a "${app_dir}/.next" "${repo_root}/.next"
      cp -a "${app_dir}/public" "${repo_root}/public"
    fi
    ;;
  *)
    echo "Usage: vercel-app.sh {install|build}" >&2
    exit 1
    ;;
esac
