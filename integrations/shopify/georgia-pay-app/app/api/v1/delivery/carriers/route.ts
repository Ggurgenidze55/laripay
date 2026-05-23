import { NextRequest } from 'next/server';
import { authenticateApiRequest } from '@/lib/laripay/auth';
import { laripayError, laripayJson } from '@/lib/laripay/api-response';
import { getMerchantDeliveryConfig, isCarrierConfigured } from '@/lib/laripay/delivery-service';
import { GEORGIAN_CARRIERS, carrierLabel } from '@/lib/georgian-delivery/registry';

export async function GET(request: NextRequest) {
  const auth = await authenticateApiRequest(request);
  if ('error' in auth) {
    return laripayError(auth.error, auth.status, 'authentication_error');
  }

  const config = await getMerchantDeliveryConfig(auth.merchant.id);
  const locale = request.headers.get('accept-language')?.startsWith('ka') ? 'ka' : 'en';

  const carriers = GEORGIAN_CARRIERS.map((c) => ({
    id: c.id,
    name: carrierLabel(c.id, locale),
    status: c.status,
    services: c.services,
    cod: c.cod,
    tracking: c.tracking,
    configured: isCarrierConfigured(config, c.id),
  }));

  return laripayJson({
    object: 'list',
    data: carriers,
    default_carrier: config.defaultCarrier,
  });
}
