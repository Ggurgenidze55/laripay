import { NextRequest } from 'next/server';
import { authenticateApiRequest } from '@/lib/laripay/auth';
import { laripayError, laripayJson } from '@/lib/laripay/api-response';
import { runOrdersSync } from '@/lib/laripay/warehouse-service';
import { recordIntegrationFromRequest } from '@/lib/laripay/integration-platform';
import { isWarehouseSystemId } from '@/lib/georgian-warehouse/registry';
import type { WarehouseSystemId } from '@/lib/georgian-warehouse/registry';

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

  const orders = body.orders;
  if (!Array.isArray(orders) || orders.length === 0) {
    return laripayError('orders array is required');
  }

  const raw = body.system ? String(body.system) : undefined;
  const system =
    raw && isWarehouseSystemId(raw) ? (raw as WarehouseSystemId) : undefined;

  try {
    await recordIntegrationFromRequest(auth.merchant.id, request, body).catch(() => {});

    const result = await runOrdersSync(
      auth.merchant.id,
      {
        direction: body.direction === 'pull' ? 'pull' : 'push',
        orders: orders as Array<Record<string, unknown>>,
      },
      system,
    );
    return laripayJson(result, 202);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Orders sync failed';
    return laripayError(message, 422);
  }
}
