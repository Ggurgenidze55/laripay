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
exports.LedgerService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const decimal_util_1 = require("../../common/utils/decimal.util");
const crypto_1 = require("crypto");
let LedgerService = class LedgerService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async postTransaction(input) {
        const currency = input.currency || 'GEL';
        let totalDebit = 0;
        let totalCredit = 0;
        for (const line of input.lines) {
            const debit = line.debit ?? 0;
            const credit = line.credit ?? 0;
            if (debit < 0 || credit < 0)
                throw new common_1.BadRequestException('Negative amounts not allowed');
            if (debit > 0 && credit > 0)
                throw new common_1.BadRequestException('Line cannot have both debit and credit');
            totalDebit += debit;
            totalCredit += credit;
        }
        if (Math.abs(totalDebit - totalCredit) > 0.001) {
            throw new common_1.BadRequestException('Debits must equal credits');
        }
        const accounts = await this.prisma.ledgerAccount.findMany({
            where: { merchantId: input.merchantId, currency },
        });
        const accountByType = new Map(accounts.map((a) => [a.type, a]));
        const transactionId = `txn_${(0, crypto_1.randomBytes)(12).toString('base64url')}`;
        const entries = input.lines.map((line) => {
            const account = accountByType.get(line.accountType);
            if (!account) {
                throw new common_1.NotFoundException(`Ledger account ${line.accountType} not found`);
            }
            return {
                transactionId,
                accountId: account.id,
                debit: (0, decimal_util_1.toDecimal)(line.debit ?? 0),
                credit: (0, decimal_util_1.toDecimal)(line.credit ?? 0),
                currency,
                description: line.description,
                referenceType: input.referenceType,
                referenceId: input.referenceId,
            };
        });
        await this.prisma.ledgerEntry.createMany({ data: entries });
        return { transactionId, entries: entries.length };
    }
    async getMerchantBalances(merchantId, currency = 'GEL') {
        const rows = await this.getMerchantBalance(merchantId, currency);
        const pick = (type) => rows.find((r) => r.type === type)?.balance ?? 0;
        return {
            available: pick(client_1.LedgerAccountType.MERCHANT_AVAILABLE),
            pending: pick(client_1.LedgerAccountType.MERCHANT_PENDING),
            payoutReserve: pick(client_1.LedgerAccountType.PAYOUT_RESERVE),
        };
    }
    async getMerchantBalance(merchantId, currency = 'GEL') {
        const accounts = await this.prisma.ledgerAccount.findMany({
            where: { merchantId, currency },
            include: { entries: true },
        });
        return accounts.map((account) => {
            let balance = 0;
            for (const entry of account.entries) {
                balance += (0, decimal_util_1.decimalToNumber)(entry.credit) - (0, decimal_util_1.decimalToNumber)(entry.debit);
            }
            return {
                accountId: account.id,
                type: account.type,
                currency: account.currency,
                balance,
            };
        });
    }
    async ensureMerchantAccounts(merchantId, currency = 'GEL') {
        let wallet = await this.prisma.wallet.findFirst({ where: { merchantId, currency } });
        if (!wallet) {
            wallet = await this.prisma.wallet.create({ data: { merchantId, currency } });
        }
        for (const type of [
            client_1.LedgerAccountType.MERCHANT_AVAILABLE,
            client_1.LedgerAccountType.MERCHANT_PENDING,
            client_1.LedgerAccountType.PLATFORM_REVENUE,
        ]) {
            await this.prisma.ledgerAccount.upsert({
                where: {
                    walletId_type_currency: { walletId: wallet.id, type, currency },
                },
                create: { walletId: wallet.id, merchantId, type, currency },
                update: {},
            });
        }
    }
    async recordPaymentCapture(merchantId, paymentId, grossAmount, netAmount, platformFee, currency = 'GEL') {
        await this.ensureMerchantAccounts(merchantId, currency);
        return this.postTransaction({
            merchantId,
            currency,
            referenceType: 'payment',
            referenceId: paymentId,
            lines: [
                {
                    accountType: client_1.LedgerAccountType.MERCHANT_PENDING,
                    debit: grossAmount,
                    description: 'Payment capture — gross',
                },
                {
                    accountType: client_1.LedgerAccountType.PLATFORM_REVENUE,
                    credit: platformFee,
                    description: 'Platform fee',
                },
                {
                    accountType: client_1.LedgerAccountType.MERCHANT_AVAILABLE,
                    credit: netAmount,
                    description: 'Net to merchant available',
                },
            ],
        });
    }
};
exports.LedgerService = LedgerService;
exports.LedgerService = LedgerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LedgerService);
//# sourceMappingURL=ledger.service.js.map