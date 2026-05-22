import { PrismaService } from '../../prisma/prisma.service';
export declare function deliverWebhookJob(prisma: PrismaService, deliveryId: string): Promise<void>;
