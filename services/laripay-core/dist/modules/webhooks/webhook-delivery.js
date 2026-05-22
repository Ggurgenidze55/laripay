"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deliverWebhookJob = deliverWebhookJob;
const client_1 = require("@prisma/client");
const crypto_1 = require("../../common/crypto");
async function deliverWebhookJob(prisma, deliveryId) {
    const delivery = await prisma.webhookDelivery.findUnique({
        where: { id: deliveryId },
        include: { event: true, endpoint: true },
    });
    if (!delivery)
        return;
    const body = JSON.stringify({
        id: delivery.event.id,
        type: delivery.event.type,
        created: delivery.event.createdAt.toISOString(),
        data: delivery.event.payload,
    });
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = (0, crypto_1.signWebhook)(delivery.endpoint.secret, timestamp, body);
    await prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
            status: client_1.WebhookDeliveryStatus.DELIVERING,
            attempts: { increment: 1 },
        },
    });
    try {
        const response = await fetch(delivery.endpoint.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-LariPay-Signature': signature,
                'X-LariPay-Timestamp': String(timestamp),
            },
            body,
            signal: AbortSignal.timeout(15000),
        });
        if (response.ok) {
            await prisma.webhookDelivery.update({
                where: { id: deliveryId },
                data: {
                    status: client_1.WebhookDeliveryStatus.SUCCEEDED,
                    responseCode: response.status,
                    deliveredAt: new Date(),
                },
            });
            return;
        }
        throw new Error(`HTTP ${response.status}`);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Delivery failed';
        const attempts = delivery.attempts + 1;
        const maxAttempts = 6;
        const retryDelaysMs = [2_000, 60_000, 300_000, 600_000, 3_600_000, 86_400_000];
        const delay = retryDelaysMs[Math.min(attempts - 1, retryDelaysMs.length - 1)];
        const nextRetryAt = attempts < maxAttempts ? new Date(Date.now() + delay) : null;
        await prisma.webhookDelivery.update({
            where: { id: deliveryId },
            data: {
                status: attempts >= maxAttempts
                    ? client_1.WebhookDeliveryStatus.FAILED
                    : client_1.WebhookDeliveryStatus.PENDING,
                lastError: message,
                nextRetryAt,
            },
        });
        if (attempts < maxAttempts)
            throw err;
    }
}
//# sourceMappingURL=webhook-delivery.js.map