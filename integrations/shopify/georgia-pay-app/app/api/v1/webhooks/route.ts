import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateApiRequest } from '@/lib/laripay/auth';
import { LARIPAY_EVENTS } from '@/lib/laripay/constants';
import { laripayError, laripayJson } from '@/lib/laripay/api-response';

export async function GET(request: NextRequest) {
  const auth = await authenticateApiRequest(request);
  if ('error' in auth) {
    return laripayError(auth.error, auth.status, 'authentication_error');
  }

  const endpoints = await prisma.webhookEndpoint.findMany({
    where: { merchantId: auth.merchant.id },
    orderBy: { createdAt: 'desc' },
  });

  return laripayJson({
    object: 'list',
    data: endpoints.map((e) => ({
      id: e.id,
      url: e.url,
      events: JSON.parse(e.events),
      enabled: e.enabled,
    })),
    available_events: LARIPAY_EVENTS,
  });
}

export async function POST(request: NextRequest) {
  const auth = await authenticateApiRequest(request);
  if ('error' in auth) {
    return laripayError(auth.error, auth.status, 'authentication_error');
  }

  const body = await request.json();
  const url = String(body.url || '').trim();
  if (!url) return laripayError('url is required');

  const events = Array.isArray(body.events) ? body.events : ['payment.succeeded', 'payment.failed'];

  const ep = await prisma.webhookEndpoint.create({
    data: {
      merchantId: auth.merchant.id,
      url,
      events: JSON.stringify(events),
      enabled: body.enabled !== false,
    },
  });

  const merchant = await prisma.merchant.findUniqueOrThrow({
    where: { id: auth.merchant.id },
  });

  return laripayJson(
    {
      id: ep.id,
      url: ep.url,
      events,
      webhook_secret: merchant.webhookSecret,
      note: 'Use webhook_secret to verify LariPay-Signature on incoming events',
    },
    201,
  );
}
