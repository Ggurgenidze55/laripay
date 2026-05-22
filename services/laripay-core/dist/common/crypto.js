"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashApiKey = hashApiKey;
exports.generateSecretKey = generateSecretKey;
exports.generateClientSecret = generateClientSecret;
exports.signWebhook = signWebhook;
exports.verifyWebhook = verifyWebhook;
const crypto_1 = require("crypto");
function hashApiKey(fullKey) {
    return (0, crypto_1.createHash)('sha256').update(fullKey).digest('hex');
}
function generateSecretKey(mode) {
    return `sk_${mode}_${(0, crypto_1.randomBytes)(24).toString('base64url')}`;
}
function generateClientSecret() {
    return `pi_${(0, crypto_1.randomBytes)(24).toString('base64url')}_secret`;
}
function signWebhook(secret, timestamp, body) {
    return (0, crypto_1.createHmac)('sha256', secret).update(`${timestamp}.${body}`).digest('hex');
}
function verifyWebhook(secret, timestamp, signature, body) {
    const ts = parseInt(timestamp, 10);
    if (!ts || Math.abs(Date.now() / 1000 - ts) > 300)
        return false;
    const expected = signWebhook(secret, ts, body);
    try {
        return (0, crypto_1.timingSafeEqual)(Buffer.from(expected), Buffer.from(signature));
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=crypto.js.map