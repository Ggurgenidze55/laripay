import { NextRequest } from 'next/server';
import { authenticateApiRequest } from '@/lib/laripay/auth';
import { laripayError, laripayJson } from '@/lib/laripay/api-response';
import { createDeliveryShipment } from '@/lib/laripay/delivery-service';
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

    const shipment = await createDeliveryShipment(auth.merchant.id, {
      from,
      to,
      carrier,
      weight_kg: body.weight_kg != null ? Number(body.weight_kg) : undefined,
      dimensions_cm: body.dimensions_cm as Record<string, number> | undefined,
      cod_amount: body.cod_amount != null ? Number(body.cod_amount) : undefined,
      service: body.service ? String(body.service) : undefined,
      reference: body.reference ? String(body.reference) : undefined,
      description: body.description ? String(body.description) : undefined,
      clientReferenceId: body.client_reference_id
        ? String(body.client_reference_id)
        : undefined,
      items: body.items as Array<{ name: string; quantity: number; weight_kg?: number }> | undefined,
    });

    return laripayJson(shipment, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Shipment creation failed';
    return laripayError(message, 422);
  }
}
