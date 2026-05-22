import { PrismaClient } from '@prisma/client';
import { createWebhookWorker } from './webhook.worker';

async function main() {
  const prisma = new PrismaClient();
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  const worker = createWebhookWorker(prisma as never, redisUrl);
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
