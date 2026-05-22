import { NextRequest } from 'next/server';
import { authenticateApiRequest } from '@/lib/laripay/auth';
import { createRefund } from '@/lib/laripay/refunds';
import { laripayError, laripayJson } from '@/lib/laripay/api-response';

export async function POST(request: NextRequest) {
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

  const paymentId = String(body.payment_id || body.paymentId || '');
  if (!paymentId) {
    return laripayError('payment_id is required');
  }

  const idempotencyKey =
    request.headers.get('idempotency-key') ||
    (body.idempotency_key ? String(body.idempotency_key) : undefined);

  try {
    const refund = await createRefund(auth.merchant, {
      paymentId,
      amount: body.amount != null ? Number(body.amount) : undefined,
      reason: body.reason ? String(body.reason) : undefined,
      idempotencyKey,
    });
    return laripayJson(refund, idempotencyKey ? 200 : 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Refund failed';
    return laripayError(message, 422);
  }
}
