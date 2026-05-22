#!/bin/sh
set -e
cd /app

prisma() {
  node ./node_modules/prisma/build/index.js "$@"
}

echo "==> LariPay.ai: applying database schema..."
if [ -d "./prisma/migrations" ] && [ "$(ls -A ./prisma/migrations 2>/dev/null | grep -v migration_lock)" ]; then
  if ! prisma migrate deploy 2>/tmp/migrate.err; then
    if grep -q P3005 /tmp/migrate.err 2>/dev/null; then
      echo "==> DB already has schema — baselining migration history"
      for dir in ./prisma/migrations/*/; do
        name=$(basename "$dir")
        [ "$name" = "migration_lock.toml" ] && continue
        prisma migrate resolve --applied "$name" 2>/dev/null || true
      done
    else
      echo "==> migrate deploy failed — db push"
      cat /tmp/migrate.err 2>/dev/null || true
      prisma db push --skip-generate
    fi
  fi
else
  prisma db push --skip-generate
fi

echo "==> LariPay.ai: starting server on :${PORT:-3000}"
exec node server.js
