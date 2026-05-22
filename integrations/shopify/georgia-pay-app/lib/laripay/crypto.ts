import { createHash, randomBytes, createHmac, timingSafeEqual } from 'crypto';

export function hashApiKey(fullKey: string): string {
  return createHash('sha256').update(fullKey).digest('hex');
}

export function generateSecretKey(mode: 'test' | 'live'): string {
  const token = randomBytes(24).toString('base64url');
  return `sk_${mode}_${token}`;
}

export function generatePublishableKey(mode: 'test' | 'live'): string {
  const token = randomBytes(16).toString('base64url');
  return `pk_${mode}_${token}`;
}

export function generateWebhookSecret(): string {
  return `whsec_${randomBytes(24).toString('base64url')}`;
}

export function signWebhookPayload(secret: string, timestamp: number, body: string): string {
  const payload = `${timestamp}.${body}`;
  return createHmac('sha256', secret).update(payload).digest('hex');
}

export function verifyWebhookSignature(
  secret: string,
  timestamp: string,
  signature: string,
  body: string,
  maxAgeSec = 300,
): boolean {
  const ts = parseInt(timestamp, 10);
  if (!ts || Math.abs(Date.now() / 1000 - ts) > maxAgeSec) {
    return false;
  }
  const expected = signWebhookPayload(secret, ts, body);
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}
