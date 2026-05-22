import { Job, Worker } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { WebhooksService } from './webhooks.service';
export declare class WebhookProcessor {
    private readonly webhooks;
    private readonly prisma;
    private readonly logger;
    constructor(webhooks: WebhooksService, prisma: PrismaService);
    createWorker(redisUrl: string): Worker;
    processJob(job: Job<{
        deliveryId: string;
    }>): Promise<void>;
}
