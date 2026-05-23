import { NextRequest } from 'next/server';
import { authenticateApiRequest } from '@/lib/laripay/auth';
import { laripayError, laripayJson } from '@/lib/laripay/api-response';
import {
  getDeliveryShipment,
  trackDeliveryShipment,
} from '@/lib/laripay/delivery-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await authenticateApiRequest(request);
  if ('error' in auth) {
    return laripayError(auth.error, auth.status, 'authentication_error');
  }

  const track = request.nextUrl.searchParams.get('track') === '1';

  try {
    if (track) {
      const tracking = await trackDeliveryShipment(auth.merchant.id, params.id);
      return laripayJson(tracking);
    }

    const shipment = await getDeliveryShipment(auth.merchant.id, params.id);
    if (!shipment) {
      return laripayError('Shipment not found', 404, 'not_found');
    }
    return laripayJson(shipment);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Shipment lookup failed';
    return laripayError(message, 422);
  }
}
