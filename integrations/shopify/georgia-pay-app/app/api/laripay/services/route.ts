import { NextRequest, NextResponse } from 'next/server';
import { authenticatePortalRequest } from '@/lib/laripay/portal-session';
import { laripayError } from '@/lib/laripay/api-response';
import {
  getMerchantServices,
  activateService,
  suspendService,
  SERVICE_IDS,
  type ServiceId,
} from '@/lib/laripay/service-gate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticatePortalRequest(request);
    if ('error' in auth) {
      return laripayError(auth.error, auth.status, 'authentication_error');
    }

    const services = await getMerchantServices(auth.merchantId);
    return NextResponse.json({ services });
  } catch (err) {
    console.error('[laripay/services] GET error:', err);
    return laripayError('Failed to fetch services', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticatePortalRequest(request);
    if ('error' in auth) {
      return laripayError(auth.error, auth.status, 'authentication_error');
    }

    const body = await request.json();
    const { service_id, action, paid_until } = body as {
      service_id?: string;
      action?: 'activate' | 'suspend';
      paid_until?: string;
    };

    if (!service_id || !action) {
      return laripayError('service_id and action are required', 400);
    }

    if (!SERVICE_IDS.includes(service_id as ServiceId)) {
      return laripayError(`Unknown service: ${service_id}`, 400);
    }

    const sid = service_id as ServiceId;

    if (action === 'activate') {
      const paidUntil = paid_until
        ? new Date(paid_until)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      await activateService(auth.merchantId, sid, { paidUntil });
    } else if (action === 'suspend') {
      await suspendService(auth.merchantId, sid);
    } else {
      return laripayError('action must be "activate" or "suspend"', 400);
    }

    const services = await getMerchantServices(auth.merchantId);
    return NextResponse.json({
      success: true,
      message: `Service ${sid} ${action}d`,
      services,
    });
  } catch (err) {
    console.error('[laripay/services] POST error:', err);
    return laripayError('Failed to update service', 500);
  }
}
