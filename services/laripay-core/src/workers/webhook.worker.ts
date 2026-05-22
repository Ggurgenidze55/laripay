import { Worker } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { deliverWebhookJob } from '../modules/webhooks/webhook-delivery';
import { WEBHOOK_QUEUE } from '../modules/webhooks/webhooks.service';

/** Standalone webhook worker — import from WebhooksModule or run via RUN_WORKERS=1. */
export function createWebhookWorker(prisma: PrismaService, redisUrl: string): Worker {
  return new Worker(
    WEBHOOK_QUEUE,
    async (job) => {
      await deliverWebhookJob(prisma, job.data.deliveryId);
    },
    { connection: { url: redisUrl } },
  );
}
