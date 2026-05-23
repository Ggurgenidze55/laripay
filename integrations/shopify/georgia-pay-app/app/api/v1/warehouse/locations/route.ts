import { NextRequest } from 'next/server';
import { authenticateApiRequest } from '@/lib/laripay/auth';
import { laripayError, laripayJson } from '@/lib/laripay/api-response';
import { listWarehouseLocations } from '@/lib/laripay/warehouse-service';
import { isWarehouseSystemId } from '@/lib/georgian-warehouse/registry';
import type { WarehouseSystemId } from '@/lib/georgian-warehouse/registry';

export async function GET(request: NextRequest) {
  const auth = await authenticateApiRequest(request);
  if ('error' in auth) {
    return laripayError(auth.error, auth.status, 'authentication_error');
  }

  const raw = request.nextUrl.searchParams.get('system') || undefined;
  const system =
    raw && isWarehouseSystemId(raw) ? (raw as WarehouseSystemId) : undefined;

  try {
    const result = await listWarehouseLocations(auth.merchant.id, system);
    return laripayJson({
      object: 'warehouse.location_list',
      system: result.system,
      data: result.warehouses,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Warehouse list failed';
    return laripayError(message, 422);
  }
}
