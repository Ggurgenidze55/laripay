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
exports.TokensService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const prisma_service_1 = require("../../prisma/prisma.service");
let TokensService = class TokensService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async tokenizeCard(merchantId, body) {
        const panFingerprint = body.encrypted_payload
            ? (0, crypto_1.createHash)('sha256').update(body.encrypted_payload).digest('hex').slice(0, 16)
            : (0, crypto_1.randomBytes)(8).toString('hex');
        const tokenRef = `tok_${(0, crypto_1.randomBytes)(18).toString('base64url')}`;
        const token = await this.prisma.cardToken.create({
            data: {
                merchantId,
                customerId: body.customer_id,
                tokenRef,
                last4: body.last4 || '4242',
                brand: body.brand || 'visa',
                expMonth: body.exp_month,
                expYear: body.exp_year,
                fingerprint: panFingerprint,
                encrypted: body.encrypted_payload ? '[redacted]' : null,
                provider: 'mock',
            },
        });
        return {
            id: token.id,
            object: 'card_token',
            token: tokenRef,
            last4: token.last4,
            brand: token.brand,
            exp_month: token.expMonth,
            exp_year: token.expYear,
            usable_for: ['direct', 'embedded', 'recurring'],
        };
    }
};
exports.TokensService = TokensService;
exports.TokensService = TokensService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TokensService);
//# sourceMappingURL=tokens.service.js.map