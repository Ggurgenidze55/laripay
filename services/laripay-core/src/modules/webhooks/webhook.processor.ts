import { Injectable, Logger } from '@nestjs/common';
import { Job, Worker } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { WebhooksService, WEBHOOK_QUEUE } from './webhooks.service';

/** BullMQ processor for webhook deliveries (also used by standalone worker). */
@Injectable()
export class WebhookProcessor {
  private readonly logger = new Logger(WebhookProcessor.name);

  constructor(
    private readonly webhooks: WebhooksService,
    private readonly prisma: PrismaService,
  ) {}

  createWorker(redisUrl: string): Worker {
    return new Worker(
      WEBHOOK_QUEUE,
      async (job: Job<{ deliveryId: string }>) => {
        await this.webhooks.deliverWebhook(job.data.deliveryId);
      },
      { connection: { url: redisUrl } },
    );
  }

  async processJob(job: Job<{ deliveryId: string }>): Promise<void> {
    this.logger.debug(`Processing delivery ${job.data.deliveryId}`);
    await this.webhooks.deliverWebhook(job.data.deliveryId);
    void this.prisma;
  }
}
