import { NextRequest } from 'next/server';
import { authenticateApiRequest } from '@/lib/laripay/auth';
import { laripayError, laripayJson } from '@/lib/laripay/api-response';
import { runStockSync } from '@/lib/laripay/warehouse-service';
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

  const raw = body.system ? String(body.system) : undefined;
  const system =
    raw && isWarehouseSystemId(raw) ? (raw as WarehouseSystemId) : undefined;

  try {
    await recordIntegrationFromRequest(auth.merchant.id, request, body).catch(() => {});

    const result = await runStockSync(
      auth.merchant.id,
      {
        direction: body.direction === 'push' ? 'push' : 'pull',
        warehouse_id: body.warehouse_id ? String(body.warehouse_id) : undefined,
        skus: Array.isArray(body.skus) ? body.skus.map(String) : undefined,
        items: body.items as Array<{ sku: string; quantity: number }> | undefined,
      },
      system,
    );
    return laripayJson(result, 202);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Stock sync failed';
    return laripayError(message, 422);
  }
}
