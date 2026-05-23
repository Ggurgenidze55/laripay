import { NextRequest } from 'next/server';
import { authenticateApiRequest } from '@/lib/laripay/auth';
import { laripayError, laripayJson } from '@/lib/laripay/api-response';
import { quoteDeliveryRates } from '@/lib/laripay/delivery-service';
import { recordIntegrationFromRequest } from '@/lib/laripay/integration-platform';
import { isGeorgianCarrierId } from '@/lib/georgian-delivery/registry';
import type { GeorgianCarrierId } from '@/lib/georgian-delivery/registry';

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

  const from = body.from as Record<string, unknown> | undefined;
  const to = body.to as Record<string, unknown> | undefined;
  if (!from?.city || !to?.city) {
    return laripayError('from and to addresses with city are required');
  }

  const rawCarrier = body.carrier ? String(body.carrier) : undefined;
  const carrier =
    rawCarrier && isGeorgianCarrierId(rawCarrier) ? (rawCarrier as GeorgianCarrierId) : undefined;

  try {
    await recordIntegrationFromRequest(auth.merchant.id, request, body).catch(() => {});

    const result = await quoteDeliveryRates(
      auth.merchant.id,
      {
        from,
        to,
        weight_kg: body.weight_kg != null ? Number(body.weight_kg) : undefined,
        dimensions_cm: body.dimensions_cm as Record<string, number> | undefined,
        cod_amount: body.cod_amount != null ? Number(body.cod_amount) : undefined,
        service: body.service ? String(body.service) : undefined,
      },
      carrier,
    );

    return laripayJson({
      object: 'delivery.rate_quote',
      carrier: result.carrier,
      rates: result.rates,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Rate quote failed';
    return laripayError(message, 422);
  }
}
