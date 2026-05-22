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
exports.OpenBankingController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const api_key_guard_1 = require("../../common/guards/api-key.guard");
const open_banking_service_1 = require("./open-banking.service");
let OpenBankingController = class OpenBankingController {
    constructor(opb) {
        this.opb = opb;
    }
    banks() {
        return this.opb.listBanks();
    }
    create(req, body) {
        return this.opb.createSession(req.merchantId, body);
    }
    scaPage(token, bank, res) {
        res.type('html').send(this.opb.getScaPage(token, bank || 'tbc'));
    }
    async approve(token, res) {
        const result = await this.opb.approveSca(token);
        res.json(result);
    }
};
exports.OpenBankingController = OpenBankingController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('banks'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], OpenBankingController.prototype, "banks", null);
__decorate([
    (0, swagger_1.ApiSecurity)('api-key'),
    (0, common_1.UseGuards)(api_key_guard_1.ApiKeyGuard),
    (0, common_1.Post)('sessions'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], OpenBankingController.prototype, "create", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('sca/:token'),
    __param(0, (0, common_1.Param)('token')),
    __param(1, (0, common_1.Query)('bank')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], OpenBankingController.prototype, "scaPage", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('sca/:token/approve'),
    __param(0, (0, common_1.Param)('token')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], OpenBankingController.prototype, "approve", null);
exports.OpenBankingController = OpenBankingController = __decorate([
    (0, swagger_1.ApiTags)('open-banking'),
    (0, common_1.Controller)('v1/open-banking'),
    __metadata("design:paramtypes", [open_banking_service_1.OpenBankingService])
], OpenBankingController);
//# sourceMappingURL=open-banking.controller.js.map