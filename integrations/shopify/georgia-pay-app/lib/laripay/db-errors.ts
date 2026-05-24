function prismaCode(err: unknown): string | undefined {
  if (err && typeof err === 'object' && 'code' in err) {
    return String((err as { code: string }).code);
  }
  return undefined;
}

export function isTransientDbError(err: unknown): boolean {
  const code = prismaCode(err);
  if (code && /^P100[0-9]$|^P101[0-7]$|^P2024$/.test(code)) {
    return true;
  }

  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes('starting up') ||
    msg.includes("Can't reach database") ||
    msg.includes('Connection refused') ||
    msg.includes('Connection timed out') ||
    msg.includes('ECONNREFUSED') ||
    msg.includes('ETIMEDOUT') ||
    msg.includes('ENOTFOUND') ||
    msg.includes('db_timeout') ||
    msg.includes('pool timeout') ||
    msg.includes('Connection pool') ||
    msg.includes('P1001') ||
    msg.includes('P1017')
  );
}

export function transientDbMessage(): string {
  return 'Database is waking up. Wait a few seconds and try again.';
}

export function databaseMisconfiguredUserMessage(hint?: string): string {
  if (hint?.includes('DATABASE_URL is not set')) {
    return 'Database is not connected on this server. Set DATABASE_URL (Railway DATABASE_PUBLIC_URL) and redeploy.';
  }
  if (hint?.includes('Local Postgres') || hint?.includes('localhost')) {
    return 'Local database is not running. Start Postgres or set Railway DATABASE_PUBLIC_URL in .env.';
  }
  if (hint?.includes('Build-time localhost')) {
    return 'Database is not connected on Vercel. Add Railway DATABASE_PUBLIC_URL as DATABASE_URL and redeploy.';
  }
  if (hint?.includes('DATABASE_PUBLIC_URL') || hint?.includes('railway.internal')) {
    return 'Database URL is misconfigured. Use Railway DATABASE_PUBLIC_URL on Vercel.';
  }
  return hint || 'Database is unavailable. Try again in a few seconds.';
}
