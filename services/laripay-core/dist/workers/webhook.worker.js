"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWebhookWorker = createWebhookWorker;
const bullmq_1 = require("bullmq");
const webhook_delivery_1 = require("../modules/webhooks/webhook-delivery");
const webhooks_service_1 = require("../modules/webhooks/webhooks.service");
function createWebhookWorker(prisma, redisUrl) {
    return new bullmq_1.Worker(webhooks_service_1.WEBHOOK_QUEUE, async (job) => {
        await (0, webhook_delivery_1.deliverWebhookJob)(prisma, job.data.deliveryId);
    }, { connection: { url: redisUrl } });
}
//# sourceMappingURL=webhook.worker.js.map