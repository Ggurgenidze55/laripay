import { createHash, createHmac, randomBytes, timingSafeEqual } from 'crypto';

export function hashApiKey(fullKey: string): string {
  return createHash('sha256').update(fullKey).digest('hex');
}

export function generateSecretKey(mode: 'test' | 'live'): string {
  return `sk_${mode}_${randomBytes(24).toString('base64url')}`;
}

export function generateClientSecret(): string {
  return `pi_${randomBytes(24).toString('base64url')}_secret`;
}

export function signWebhook(secret: string, timestamp: number, body: string): string {
  return createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex');
}

export function verifyWebhook(secret: string, timestamp: string, signature: string, body: string): boolean {
  const ts = parseInt(timestamp, 10);
  if (!ts || Math.abs(Date.now() / 1000 - ts) > 300) return false;
  const expected = signWebhook(secret, ts, body);
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}
