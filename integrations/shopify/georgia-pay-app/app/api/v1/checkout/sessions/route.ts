import { NextRequest } from 'next/server';
import { authenticateApiRequest } from '@/lib/laripay/auth';
import { createCheckoutSession } from '@/lib/laripay/checkout';
import { laripayError, laripayJson } from '@/lib/laripay/api-response';
import { getLariPayCoreBaseUrl, proxyToLariPayCore } from '@/lib/laripay-core/proxy';

export async function POST(request: NextRequest) {
  if (getLariPayCoreBaseUrl()) {
    const authHeader = request.headers.get('authorization') || '';
    const idempotencyKey = request.headers.get('idempotency-key') || undefined;
    const body = await request.text();
    const proxied = await proxyToLariPayCore('/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
      },
      body,
    });
    if (proxied) {
      const data = await proxied.json().catch(() => ({}));
      return new Response(JSON.stringify(data), {
        status: proxied.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  const auth = await authenticateApiRequest(request);
  if ('error' in auth) {
    return laripayError(auth.error, auth.status, 'authentication_error');
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return laripayError('Invalid JSON body');
  }

  const amount = Number(body.amount);
  const successUrl = String(body.success_url || body.successUrl || '');
  if (!successUrl) {
    return laripayError('success_url is required');
  }

  const idempotencyKey =
    request.headers.get('idempotency-key') ||
    (body.idempotency_key ? String(body.idempotency_key) : undefined);

  try {
    const session = await createCheckoutSession(auth.merchant, {
      amount,
      currency: String(body.currency || 'GEL'),
      provider: body.provider as 'tbc' | 'bog' | undefined,
      successUrl,
      cancelUrl: body.cancel_url ? String(body.cancel_url) : undefined,
      clientReferenceId: body.client_reference_id
        ? String(body.client_reference_id)
        : undefined,
      idempotencyKey,
      metadata:
        body.metadata && typeof body.metadata === 'object'
          ? (body.metadata as Record<string, unknown>)
          : undefined,
    });
    return laripayJson(session, idempotencyKey ? 200 : 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Checkout failed';
    return laripayError(message, 422);
  }
}
