import { NextRequest } from 'next/server';
import { authenticateApiRequest } from '@/lib/laripay/auth';
import { laripayError, laripayJson } from '@/lib/laripay/api-response';
import {
  getMerchantWarehouseConfig,
  isWarehouseSystemConfigured,
} from '@/lib/laripay/warehouse-service';
import { WAREHOUSE_SYSTEMS, warehouseSystemLabel } from '@/lib/georgian-warehouse/registry';

export async function GET(request: NextRequest) {
  const auth = await authenticateApiRequest(request);
  if ('error' in auth) {
    return laripayError(auth.error, auth.status, 'authentication_error');
  }

  const config = await getMerchantWarehouseConfig(auth.merchant.id);
  const locale = request.headers.get('accept-language')?.startsWith('ka') ? 'ka' : 'en';

  const systems = WAREHOUSE_SYSTEMS.map((s) => ({
    id: s.id,
    name: warehouseSystemLabel(s.id, locale),
    status: s.status,
    capabilities: s.capabilities,
    configured: isWarehouseSystemConfigured(config, s.id),
  }));

  return laripayJson({
    object: 'list',
    data: systems,
    default_system: config.defaultSystem,
  });
}
