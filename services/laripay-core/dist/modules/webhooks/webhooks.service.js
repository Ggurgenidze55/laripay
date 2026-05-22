"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var WebhooksService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhooksService = exports.WEBHOOK_QUEUE = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
const bullmq_1 = require("bullmq");
const crypto_1 = require("crypto");
const prisma_service_1 = require("../../prisma/prisma.service");
const webhook_worker_1 = require("../../workers/webhook.worker");
const webhook_delivery_1 = require("./webhook-delivery");
exports.WEBHOOK_QUEUE = 'webhooks';
let WebhooksService = WebhooksService_1 = class WebhooksService {
    constructor(prisma, config) {
        this.prisma = prisma;
        this.config = config;
        this.logger = new common_1.Logger(WebhooksService_1.name);
    }
    onModuleInit() {
        const connection = { url: this.config.get('redisUrl') };
        this.queue = new bullmq_1.Queue(exports.WEBHOOK_QUEUE, { connection });
        if (this.config.get('workerEnabled')) {
            const worker = (0, webhook_worker_1.createWebhookWorker)(this.prisma, connection.url);
            this.workerClose = () => worker.close();
            this.logger.log('Webhook worker started');
        }
    }
    async onModuleDestroy() {
        await this.queue?.close();
        if (this.workerClose)
            await this.workerClose();
    }
    getQueue() {
        return this.queue;
    }
    async registerEndpoint(merchantId, dto) {
        const secret = (0, crypto_1.randomBytes)(24).toString('base64url');
        return this.prisma.webhookEndpoint.create({
            data: {
                merchantId,
                url: dto.url,
                secret,
                events: dto.events,
            },
        });
    }
    async emitEvent(merchantId, type, payload) {
        const event = await this.prisma.webhookEvent.create({
            data: { merchantId, type, payload: payload },
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
                    status: client_1.WebhookDeliveryStatus.PENDING,
                },
            });
            await this.queue.add('deliver', { deliveryId: delivery.id }, { attempts: 6, backoff: { type: 'fixed', delay: 2000 } });
        }
        return event;
    }
    async deliverWebhook(deliveryId) {
        return (0, webhook_delivery_1.deliverWebhookJob)(this.prisma, deliveryId);
    }
    async listEndpoints(merchantId) {
        return this.prisma.webhookEndpoint.findMany({
            where: { merchantId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async listDeliveries(merchantId) {
        return this.prisma.webhookDelivery.findMany({
            where: { endpoint: { merchantId } },
            orderBy: { createdAt: 'desc' },
            take: 100,
            include: { event: true, endpoint: { select: { url: true } } },
        });
    }
};
exports.WebhooksService = WebhooksService;
exports.WebhooksService = WebhooksService = WebhooksService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], WebhooksService);
//# sourceMappingURL=webhooks.service.js.map