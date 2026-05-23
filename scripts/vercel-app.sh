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
    if [ "$in_app_root" = "0" ] && [ -n "${VERCEL_ENV:-}" ]; then
      echo "[vercel-app] sync .next, public, node_modules -> repo root for Vercel"
      if [ ! -f "${app_dir}/.next/routes-manifest.json" ]; then
        echo "[vercel-app] ERROR: missing ${app_dir}/.next/routes-manifest.json after build" >&2
        exit 1
      fi
      rm -rf "${repo_root}/.next" "${repo_root}/public" "${repo_root}/node_modules"
      cp -a "${app_dir}/.next" "${repo_root}/.next"
      cp -a "${app_dir}/public" "${repo_root}/public"
      # Must copy — Vercel serverless does not follow symlinks (API routes 500 otherwise).
      cp -a "${app_dir}/node_modules" "${repo_root}/node_modules"
      if [ ! -f "${repo_root}/.next/routes-manifest.json" ]; then
        echo "[vercel-app] ERROR: sync failed — ${repo_root}/.next/routes-manifest.json missing" >&2
        exit 1
      fi
      # Vercel Next builder may resolve the app as shopify/georgia-pay-app (ENOENT on routes-manifest).
      legacy_app="${repo_root}/shopify/georgia-pay-app"
      mkdir -p "${repo_root}/shopify"
      rm -rf "${legacy_app}"
      ln -sfn "${app_dir}" "${legacy_app}"
      if [ ! -f "${legacy_app}/.next/routes-manifest.json" ]; then
        echo "[vercel-app] ERROR: ${legacy_app}/.next/routes-manifest.json missing (symlink ${legacy_app} -> ${app_dir})" >&2
        exit 1
      fi
      echo "[vercel-app] linked ${legacy_app} -> ${app_dir}"
    fi
    ;;
  *)
    echo "Usage: vercel-app.sh {install|build}" >&2
    exit 1
    ;;
esac
