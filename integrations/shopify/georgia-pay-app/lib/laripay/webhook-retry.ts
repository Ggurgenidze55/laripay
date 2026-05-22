import prisma from '@/lib/prisma';
import { signWebhookPayload } from './crypto';

const MAX_ATTEMPTS = 5;

export async function retryFailedWebhookDeliveries(limit = 20) {
  const pending = await prisma.webhookDelivery.findMany({
    where: {
      status: 'failed',
      attempts: { lt: MAX_ATTEMPTS },
    },
    orderBy: { updatedAt: 'asc' },
    take: limit,
  });

  let retried = 0;
  let delivered = 0;

  for (const delivery of pending) {
    if (!delivery.endpointId) continue;

    const endpoint = await prisma.webhookEndpoint.findUnique({
      where: { id: delivery.endpointId },
    });
    if (!endpoint?.enabled) continue;

    const merchant = await prisma.merchant.findUnique({
      where: { id: delivery.merchantId },
    });
    if (!merchant) continue;

    const timestamp = Math.floor(Date.now() / 1000);
    const signature = signWebhookPayload(merchant.webhookSecret, timestamp, delivery.payload);

    retried += 1;
    try {
      const res = await fetch(endpoint.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'LariPay-Signature': signature,
          'LariPay-Timestamp': String(timestamp),
          'LariPay-Event': delivery.event,
        },
        body: delivery.payload,
        signal: AbortSignal.timeout(15000),
      });

      await prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          status: res.ok ? 'delivered' : 'failed',
          attempts: delivery.attempts + 1,
          responseCode: res.status,
          lastError: res.ok ? null : await res.text().catch(() => 'HTTP error'),
        },
      });
      if (res.ok) delivered += 1;
    } catch (err) {
      await prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          status: 'failed',
          attempts: delivery.attempts + 1,
          lastError: err instanceof Error ? err.message : String(err),
        },
      });
    }
  }

  return { retried, delivered };
}
