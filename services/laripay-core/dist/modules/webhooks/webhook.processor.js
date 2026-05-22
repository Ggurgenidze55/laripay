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
var WebhookProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookProcessor = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("bullmq");
const prisma_service_1 = require("../../prisma/prisma.service");
const webhooks_service_1 = require("./webhooks.service");
let WebhookProcessor = WebhookProcessor_1 = class WebhookProcessor {
    constructor(webhooks, prisma) {
        this.webhooks = webhooks;
        this.prisma = prisma;
        this.logger = new common_1.Logger(WebhookProcessor_1.name);
    }
    createWorker(redisUrl) {
        return new bullmq_1.Worker(webhooks_service_1.WEBHOOK_QUEUE, async (job) => {
            await this.webhooks.deliverWebhook(job.data.deliveryId);
        }, { connection: { url: redisUrl } });
    }
    async processJob(job) {
        this.logger.debug(`Processing delivery ${job.data.deliveryId}`);
        await this.webhooks.deliverWebhook(job.data.deliveryId);
        void this.prisma;
    }
};
exports.WebhookProcessor = WebhookProcessor;
exports.WebhookProcessor = WebhookProcessor = WebhookProcessor_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [webhooks_service_1.WebhooksService,
        prisma_service_1.PrismaService])
], WebhookProcessor);
//# sourceMappingURL=webhook.processor.js.map