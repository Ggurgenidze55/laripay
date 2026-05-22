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
exports.QrService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto_1 = require("crypto");
const prisma_service_1 = require("../../prisma/prisma.service");
const decimal_util_1 = require("../../common/utils/decimal.util");
let QrService = class QrService {
    constructor(prisma, config) {
        this.prisma = prisma;
        this.config = config;
    }
    async create(merchantId, body) {
        const code = (0, crypto_1.randomBytes)(10).toString('base64url');
        const base = this.config.get('checkoutBaseUrl') || 'http://localhost:4000';
        const payloadUrl = `${base}/api/v1/qr/${code}`;
        const qr = await this.prisma.qrPayment.create({
            data: {
                merchantId,
                orderId: body.order_id,
                code,
                amount: (0, decimal_util_1.toDecimal)(body.amount),
                currency: body.currency || 'GEL',
                payloadUrl,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            },
        });
        return {
            id: qr.id,
            code: qr.code,
            amount: (0, decimal_util_1.decimalToNumber)(qr.amount),
            currency: qr.currency,
            qr_url: payloadUrl,
            status: qr.status,
            expires_at: Math.floor(qr.expiresAt.getTime() / 1000),
        };
    }
    async resolve(code) {
        const qr = await this.prisma.qrPayment.findUnique({ where: { code } });
        if (!qr)
            return { error: 'not_found' };
        return {
            code: qr.code,
            amount: (0, decimal_util_1.decimalToNumber)(qr.amount),
            currency: qr.currency,
            status: qr.status,
            pay_url: qr.payloadUrl,
        };
    }
};
exports.QrService = QrService;
exports.QrService = QrService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], QrService);
//# sourceMappingURL=qr.service.js.map