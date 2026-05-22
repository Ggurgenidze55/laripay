import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterEndpointDto } from './dto/register-endpoint.dto';
export declare const WEBHOOK_QUEUE = "webhooks";
export declare class WebhooksService implements OnModuleInit, OnModuleDestroy {
    private readonly prisma;
    private readonly config;
    private readonly logger;
    private queue;
    private workerClose?;
    constructor(prisma: PrismaService, config: ConfigService);
    onModuleInit(): void;
    onModuleDestroy(): Promise<void>;
    getQueue(): Queue;
    registerEndpoint(merchantId: string, dto: RegisterEndpointDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        merchantId: string;
        secret: string;
        url: string;
        events: string[];
        enabled: boolean;
    }>;
    emitEvent(merchantId: string, type: string, payload: Record<string, unknown>): Promise<{
        id: string;
        createdAt: Date;
        merchantId: string;
        type: string;
        payload: Prisma.JsonValue;
    }>;
    deliverWebhook(deliveryId: string): Promise<void>;
    listEndpoints(merchantId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        merchantId: string;
        secret: string;
        url: string;
        events: string[];
        enabled: boolean;
    }[]>;
    listDeliveries(merchantId: string): Promise<({
        event: {
            id: string;
            createdAt: Date;
            merchantId: string;
            type: string;
            payload: Prisma.JsonValue;
        };
        endpoint: {
            url: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.WebhookDeliveryStatus;
        eventId: string;
        endpointId: string;
        attempts: number;
        responseCode: number | null;
        lastError: string | null;
        nextRetryAt: Date | null;
        deliveredAt: Date | null;
    })[]>;
}
