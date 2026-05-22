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
exports.OpenBankingService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto_1 = require("crypto");
const prisma_service_1 = require("../../prisma/prisma.service");
const payments_service_1 = require("../payments/payments.service");
const decimal_util_1 = require("../../common/utils/decimal.util");
const BANKS = [
    { code: 'tbc', name: 'TBC Bank', payment_system: 'opb' },
    { code: 'bog', name: 'Bank of Georgia', payment_system: 'opb' },
    { code: 'liberty', name: 'Liberty Bank', payment_system: 'opb' },
    { code: 'credo', name: 'Credo Bank', payment_system: 'opb' },
];
let OpenBankingService = class OpenBankingService {
    constructor(prisma, payments, config) {
        this.prisma = prisma;
        this.payments = payments;
        this.config = config;
    }
    listBanks() {
        return { object: 'list', data: BANKS };
    }
    async createSession(merchantId, body) {
        const bank = body.bank || 'tbc';
        const token = `opb_${(0, crypto_1.randomBytes)(16).toString('base64url')}`;
        const intent = await this.payments.createIntent(merchantId, {
            amount: body.amount,
            currency: body.currency || 'GEL',
            metadata: { payment_system: 'opb', bank, opb_token: token },
            successUrl: body.success_url,
        });
        const base = this.config.get('checkoutBaseUrl') || 'http://localhost:4000';
        return {
            payment_token: token,
            payment_system: 'opb',
            bank,
            intent_id: intent.id,
            client_secret: intent.client_secret,
            sca_url: `${base}/api/v1/open-banking/sca/${token}?bank=${bank}`,
            status: 'pending',
            amount: body.amount,
            currency: body.currency || 'GEL',
        };
    }
    getScaPage(token, bank) {
        const label = BANKS.find((b) => b.code === bank)?.name || bank;
        return `<!DOCTYPE html><html><body style="font-family:system-ui;background:#0f172a;color:#fff;min-height:100vh;display:flex;align-items:center;justify-content:center">
    <form method="POST" action="${this.config.get('checkoutBaseUrl') || ''}/api/v1/open-banking/sca/${token}/approve" style="text-align:center">
    <h1>${label}</h1><p>Open Banking · SCA approval (sandbox)</p>
    <button style="padding:12px 24px;border-radius:8px;border:0;background:#06b6d4;color:#000;font-weight:600">Approve transfer</button>
    </form></body></html>`;
    }
    async approveSca(token) {
        const candidates = await this.prisma.paymentIntent.findMany({
            where: { status: { in: ['PENDING', 'PROCESSING', 'AUTHORIZED'] } },
            orderBy: { createdAt: 'desc' },
            take: 200,
        });
        const intent = candidates.find((i) => {
            const meta = i.metadata;
            return meta?.opb_token === token;
        });
        if (!intent)
            throw new common_1.NotFoundException('OPB session not found');
        await this.payments.authorize(intent.merchantId, intent.id);
        const result = await this.payments.capture(intent.merchantId, intent.id);
        return {
            status: 'approved',
            intent_id: intent.id,
            amount: (0, decimal_util_1.decimalToNumber)(intent.amount),
            payment: result.payment,
        };
    }
};
exports.OpenBankingService = OpenBankingService;
exports.OpenBankingService = OpenBankingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        payments_service_1.PaymentsService,
        config_1.ConfigService])
], OpenBankingService);
//# sourceMappingURL=open-banking.service.js.map