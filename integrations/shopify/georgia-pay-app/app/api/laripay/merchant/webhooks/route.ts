import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticatePortalRequest } from '@/lib/laripay/portal-session';
import { laripayError, laripayJson } from '@/lib/laripay/api-response';
import { LARIPAY_EVENTS } from '@/lib/laripay/constants';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await authenticatePortalRequest(request);
  if ('error' in auth) {
    return laripayError(auth.error, auth.status, 'authentication_error');
  }

  const rows = await prisma.webhookEndpoint.findMany({
    where: { merchantId: auth.merchantId },
    orderBy: { createdAt: 'desc' },
  });

  return laripayJson({
    endpoints: rows.map((w) => ({
      id: w.id,
      url: w.url,
      enabled: w.enabled,
      events: w.events,
    })),
    available_events: LARIPAY_EVENTS,
  });
}

export async function POST(request: NextRequest) {
  const auth = await authenticatePortalRequest(request);
  if ('error' in auth) {
    return laripayError(auth.error, auth.status, 'authentication_error');
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return laripayError('Invalid JSON');
  }

  const url = String(body.url || '').trim();
  if (!url) return laripayError('url is required');

  const events = Array.isArray(body.events) ? body.events : ['payment.succeeded', 'payment.failed'];

  const ep = await prisma.webhookEndpoint.create({
    data: {
      merchantId: auth.merchantId,
      url,
      events: JSON.stringify(events),
      enabled: body.enabled !== false,
    },
  });

  return laripayJson(
    {
      id: ep.id,
      url: ep.url,
      events,
      enabled: ep.enabled,
    },
    201,
  );
}
