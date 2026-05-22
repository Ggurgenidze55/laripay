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
exports.FraudController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const api_key_guard_1 = require("../../common/guards/api-key.guard");
const fraud_service_1 = require("./fraud.service");
let FraudController = class FraudController {
    constructor(fraud) {
        this.fraud = fraud;
    }
    score(req, body) {
        return this.fraud.scoreTransaction({
            merchantId: req.merchantId,
            amount: body.amount,
            currency: body.currency || 'GEL',
            ipAddress: req.ip,
            deviceFingerprint: body.device_fp,
        });
    }
};
exports.FraudController = FraudController;
__decorate([
    (0, common_1.Post)('score'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], FraudController.prototype, "score", null);
exports.FraudController = FraudController = __decorate([
    (0, swagger_1.ApiTags)('fraud'),
    (0, swagger_1.ApiSecurity)('api-key'),
    (0, common_1.UseGuards)(api_key_guard_1.ApiKeyGuard),
    (0, common_1.Controller)('v1/fraud'),
    __metadata("design:paramtypes", [fraud_service_1.FraudService])
], FraudController);
//# sourceMappingURL=fraud.controller.js.map