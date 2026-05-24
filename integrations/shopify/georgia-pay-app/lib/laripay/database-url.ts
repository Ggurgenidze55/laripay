function readEnv(name: string): string | undefined {
  const value = process.env[name];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function normalizeDatabaseUrl(raw: string): string {
  if (!/^postgres(ql)?:\/\//i.test(raw)) return raw;
  try {
    const url = new URL(raw);
    if (!url.searchParams.has('connect_timeout')) {
      url.searchParams.set('connect_timeout', '10');
    }
    if (!url.searchParams.has('pool_timeout')) {
      url.searchParams.set('pool_timeout', '10');
    }
    return url.toString();
  } catch {
    return raw;
  }
}

/** Resolve Postgres URL for Prisma (Vercel needs Railway public URL, not .internal). */
export function resolveDatabaseUrl(): string | undefined {
  const direct = readEnv('DATABASE_URL');
  const publicUrl = readEnv('DATABASE_PUBLIC_URL');

  if (process.env.VERCEL && direct?.includes('railway.internal')) {
    if (publicUrl) return normalizeDatabaseUrl(publicUrl);
    return undefined;
  }

  if (process.env.VERCEL && direct && /localhost|127\.0\.0\.1|:5433\b/.test(direct)) {
    if (publicUrl) return normalizeDatabaseUrl(publicUrl);
    return undefined;
  }

  const chosen = direct || publicUrl;
  return chosen ? normalizeDatabaseUrl(chosen) : undefined;
}

export function databaseConfigHint(): string | undefined {
  const direct = readEnv('DATABASE_URL');
  const publicUrl = readEnv('DATABASE_PUBLIC_URL');

  if (!direct && !publicUrl) {
    return 'DATABASE_URL is not set.';
  }

  if (process.env.VERCEL && direct?.includes('railway.internal') && !publicUrl) {
    return 'On Vercel, set DATABASE_URL to Railway DATABASE_PUBLIC_URL (not postgres.railway.internal).';
  }

  if (process.env.VERCEL && direct && /localhost|127\.0\.0\.1|:5433\b/.test(direct) && !publicUrl) {
    return 'On Vercel, set DATABASE_URL to Railway DATABASE_PUBLIC_URL. Build-time localhost URLs are ignored.';
  }

  if (direct?.includes('railway.internal') && !process.env.RAILWAY_ENVIRONMENT) {
    return 'Use Railway DATABASE_PUBLIC_URL for external hosts (Vercel, localhost).';
  }

  return undefined;
}
