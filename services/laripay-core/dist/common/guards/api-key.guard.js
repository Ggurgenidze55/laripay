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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiKeyGuard = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const crypto_1 = require("../crypto");
let ApiKeyGuard = class ApiKeyGuard {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async canActivate(context) {
        const req = context.switchToHttp().getRequest();
        const auth = req.headers['authorization'];
        const bearer = typeof auth === 'string' && auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
        const headerKey = req.headers['x-laripay-api-key'] ||
            req.headers['x-payka-api-key'] ||
            '';
        const fullKey = bearer || headerKey;
        if (!fullKey || (!fullKey.startsWith('sk_test_') && !fullKey.startsWith('sk_live_'))) {
            throw new common_1.UnauthorizedException('Missing or invalid API key. Use Authorization: Bearer sk_test_...');
        }
        const keyHash = (0, crypto_1.hashApiKey)(fullKey);
        const apiKey = await this.prisma.apiKey.findUnique({
            where: { keyHash },
            include: { merchant: true },
        });
        if (!apiKey || apiKey.revokedAt) {
            throw new common_1.UnauthorizedException('Invalid API key');
        }
        if (apiKey.merchant.status !== client_1.MerchantStatus.ACTIVE) {
            throw new common_1.ForbiddenException('Merchant account is not active');
        }
        await this.prisma.apiKey.update({
            where: { id: apiKey.id },
            data: { lastUsedAt: new Date() },
        });
        const m = apiKey.merchant;
        req.merchantId = m.id;
        req.apiKeyId = apiKey.id;
        req.merchant = {
            id: m.id,
            slug: m.slug,
            email: m.email,
            status: m.status,
            webhookSecret: m.webhookSecret,
            defaultProvider: m.defaultProvider,
            commissionRateBps: m.commissionRateBps,
        };
        return true;
    }
};
exports.ApiKeyGuard = ApiKeyGuard;
exports.ApiKeyGuard = ApiKeyGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ApiKeyGuard);
//# sourceMappingURL=api-key.guard.js.map