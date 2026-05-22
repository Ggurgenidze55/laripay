import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdminOrError } from '@/lib/laripay/auth';
import { laripayError, laripayJson } from '@/lib/laripay/api-response';
import { LARIPAY_EVENTS } from '@/lib/laripay/constants';
import { resolveMerchantId } from '@/lib/laripay/resolve-merchant';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const adminErr = requireAdminOrError(request);
  if (adminErr) return adminErr;

  const body = await request.json();
  const url = String(body.url || '').trim();
  if (!url) return laripayError('url is required');

  const events = Array.isArray(body.events) ? body.events : ['*'];

  const merchantId = await resolveMerchantId(params.id);
  if (!merchantId) return laripayError('Merchant not found', 404);

  const ep = await prisma.webhookEndpoint.create({
    data: {
      merchantId,
      url,
      events: JSON.stringify(events),
      enabled: body.enabled !== false,
    },
  });

  return laripayJson({
    id: ep.id,
    url: ep.url,
    events,
    available_events: LARIPAY_EVENTS,
  }, 201);
}
