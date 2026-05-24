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
  return 'Database is waking up. Wait 15–20 seconds and try again.';
}
