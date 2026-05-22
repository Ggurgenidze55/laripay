"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const webhook_worker_1 = require("./webhook.worker");
async function main() {
    const prisma = new client_1.PrismaClient();
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    const worker = (0, webhook_worker_1.createWebhookWorker)(prisma, redisUrl);
    console.log('Webhook worker running on queue webhooks');
    const shutdown = async () => {
        await worker.close();
        await prisma.$disconnect();
        process.exit(0);
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}
main().catch((err) => {
    console.error(err);
    process.exit(1);
});
//# sourceMappingURL=webhook-worker.bootstrap.js.map