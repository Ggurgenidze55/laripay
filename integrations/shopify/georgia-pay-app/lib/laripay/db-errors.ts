export function isTransientDbError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes('starting up') ||
    msg.includes("Can't reach database") ||
    msg.includes('Connection refused') ||
    msg.includes('Connection timed out') ||
    msg.includes('ECONNREFUSED') ||
    msg.includes('P1001')
  );
}

export function transientDbMessage(): string {
  return 'Database is waking up. Wait 15–20 seconds and try again.';
}
