"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = () => ({
    port: parseInt(process.env.PORT || '4000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    jwt: {
        secret: process.env.JWT_SECRET || 'dev-jwt-change-in-production',
        expiresIn: process.env.JWT_EXPIRES_IN || '15m',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    },
    encryptionKey: process.env.ENCRYPTION_KEY || 'dev-aes-32-char-key-change!!!!',
    corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(','),
    workerEnabled: process.env.RUN_WORKERS === '1',
    checkoutBaseUrl: process.env.CHECKOUT_BASE_URL || 'http://localhost:4000',
    appPublicUrl: process.env.APP_PUBLIC_URL || 'http://localhost:3000',
    sandboxMode: process.env.SANDBOX_MODE !== '0',
});
//# sourceMappingURL=configuration.js.map