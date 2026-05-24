import { databaseConfigHint, resolveDatabaseUrl } from './database-url';

/** Fail fast before retry loops when Postgres is not configured. */
export function databaseMisconfiguredMessage(): string | undefined {
  const hint = databaseConfigHint();
  if (hint) return hint;

  const url = resolveDatabaseUrl();
  if (!url) return 'DATABASE_URL is not set.';

  if (!process.env.RAILWAY_ENVIRONMENT && /localhost|127\.0\.0\.1|:5433\b/.test(url)) {
    return 'Local Postgres is not running. Start it with: docker compose -f deploy/docker-compose.yml up -d postgres';
  }

  return undefined;
}
