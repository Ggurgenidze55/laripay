import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, WebhookDeliveryStatus } from '@prisma/client';
import { Queue } from 'bullmq';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterEndpointDto } from './dto/register-endpoint.dto';
import { createWebhookWorker } from '../../workers/webhook.worker';
import { deliverWebhookJob } from './webhook-delivery';

export const WEBHOOK_QUEUE = 'webhooks';

@Injectable()
export class WebhooksService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WebhooksService.name);
  private queue!: Queue;
  private workerClose?: () => Promise<void>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  onModuleInit() {
    const connection = { url: this.config.get<string>('redisUrl') };
    this.queue = new Queue(WEBHOOK_QUEUE, { connection });

    if (this.config.get<boolean>('workerEnabled')) {
      const worker = createWebhookWorker(this.prisma, connection.url!);
      this.workerClose = () => worker.close();
      this.logger.log('Webhook worker started');
    }
  }

  async onModuleDestroy() {
    await this.queue?.close();
    if (this.workerClose) await this.workerClose();
  }

  getQueue(): Queue {
    return this.queue;
  }

  async registerEndpoint(merchantId: string, dto: RegisterEndpointDto) {
    const secret = randomBytes(24).toString('base64url');
    return this.prisma.webhookEndpoint.create({
      data: {
        merchantId,
        url: dto.url,
        secret,
        events: dto.events,
      },
    });
  }

  async emitEvent(merchantId: string, type: string, payload: Record<string, unknown>) {
    const event = await this.prisma.webhookEvent.create({
      data: { merchantId, type, payload: payload as Prisma.InputJsonValue },
    });

    const endpoints = await this.prisma.webhookEndpoint.findMany({
      where: {
        merchantId,
        enabled: true,
        events: { has: type },
      },
    });

    for (const endpoint of endpoints) {
      const delivery = await this.prisma.webhookDelivery.create({
        data: {
          eventId: event.id,
          endpointId: endpoint.id,
          status: WebhookDeliveryStatus.PENDING,
        },
      });

      await this.queue.add(
        'deliver',
        { deliveryId: delivery.id },
        { attempts: 6, backoff: { type: 'fixed', delay: 2000 } },
      );
    }

    return event;
  }

  async deliverWebhook(deliveryId: string): Promise<void> {
    return deliverWebhookJob(this.prisma, deliveryId);
  }

  async listEndpoints(merchantId: string) {
    return this.prisma.webhookEndpoint.findMany({
      where: { merchantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listDeliveries(merchantId: string) {
    return this.prisma.webhookDelivery.findMany({
      where: { endpoint: { merchantId } },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { event: true, endpoint: { select: { url: true } } },
    });
  }
}
