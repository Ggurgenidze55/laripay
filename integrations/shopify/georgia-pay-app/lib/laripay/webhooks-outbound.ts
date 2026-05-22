import { platformEnv } from '@/lib/laripay-env';
import prisma from '@/lib/prisma';
import { signWebhookPayload } from './crypto';
import type { LariPayEvent } from './constants';

export async function dispatchMerchantWebhook(
  merchantId: string,
  event: LariPayEvent,
  data: Record<string, unknown>,
) {
  const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } });
  if (!merchant) return;

  const endpoints = await prisma.webhookEndpoint.findMany({
    where: { merchantId, enabled: true },
  });

  const payload = JSON.stringify({
    id: `evt_${Date.now()}`,
    object: 'event',
    type: event,
    created: Math.floor(Date.now() / 1000),
    data: { object: data },
    livemode: process.env.TBC_ENV !== 'sandbox',
  });

  const timestamp = Math.floor(Date.now() / 1000);
  const signature = signWebhookPayload(merchant.webhookSecret, timestamp, payload);

  const matching = endpoints.filter((ep) => {
    try {
      const events = JSON.parse(ep.events) as string[];
      return events.includes('*') || events.includes(event);
    } catch {
      return true;
    }
  });

  const targets =
    matching.length > 0
      ? matching
      : endpoints.length === 0
        ? []
        : [];

  if (targets.length === 0 && platformEnv('LOG_WEBHOOKS') === '1') {
    console.log('[laripay webhook]', event, data);
  }

  for (const ep of targets) {
    const delivery = await prisma.webhookDelivery.create({
      data: {
        merchantId,
        endpointId: ep.id,
        event,
        payload,
        status: 'pending',
      },
    });

    try {
      const res = await fetch(ep.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'LariPay-Signature': signature,
          'LariPay-Timestamp': String(timestamp),
          'LariPay-Event': event,
        },
        body: payload,
        signal: AbortSignal.timeout(15000),
      });

      await prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          status: res.ok ? 'delivered' : 'failed',
          attempts: 1,
          responseCode: res.status,
          lastError: res.ok ? null : await res.text().catch(() => 'HTTP error'),
        },
      });
    } catch (err) {
      await prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          status: 'failed',
          attempts: 1,
          lastError: err instanceof Error ? err.message : String(err),
        },
      });
    }
  }
}
