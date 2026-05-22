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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const api_key_guard_1 = require("../../common/guards/api-key.guard");
const ledger_service_1 = require("../ledger/ledger.service");
const prisma_service_1 = require("../../prisma/prisma.service");
let WalletsController = class WalletsController {
    constructor(ledger, prisma) {
        this.ledger = ledger;
        this.prisma = prisma;
    }
    async balance(req) {
        const balances = await this.ledger.getMerchantBalances(req.merchantId);
        return {
            object: 'balance',
            currency: 'GEL',
            available: balances.available,
            pending: balances.pending,
            payout_reserve: balances.payoutReserve,
        };
    }
    async ledgerEntries(req) {
        const accounts = await this.prisma.ledgerAccount.findMany({
            where: { merchantId: req.merchantId },
            include: {
                entries: { orderBy: { createdAt: 'desc' }, take: 50 },
            },
        });
        return {
            object: 'ledger',
            accounts: accounts.map((a) => ({
                id: a.id,
                type: a.type,
                currency: a.currency,
                entries: a.entries,
            })),
        };
    }
};
exports.WalletsController = WalletsController;
__decorate([
    (0, common_1.Get)('balance'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WalletsController.prototype, "balance", null);
__decorate([
    (0, common_1.Get)('ledger'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WalletsController.prototype, "ledgerEntries", null);
exports.WalletsController = WalletsController = __decorate([
    (0, swagger_1.ApiTags)('wallets'),
    (0, swagger_1.ApiSecurity)('api-key'),
    (0, common_1.UseGuards)(api_key_guard_1.ApiKeyGuard),
    (0, common_1.Controller)('v1/wallets'),
    __metadata("design:paramtypes", [ledger_service_1.LedgerService,
        prisma_service_1.PrismaService])
], WalletsController);
//# sourceMappingURL=wallets.controller.js.map