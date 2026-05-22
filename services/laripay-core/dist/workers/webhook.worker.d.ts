import { Worker } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
export declare function createWebhookWorker(prisma: PrismaService, redisUrl: string): Worker;
