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
exports.MerchantsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const merchants_service_1 = require("./merchants.service");
const onboard_merchant_dto_1 = require("./dto/onboard-merchant.dto");
const create_api_key_dto_1 = require("./dto/create-api-key.dto");
const merchant_decorator_1 = require("../../common/decorators/merchant.decorator");
let MerchantsController = class MerchantsController {
    constructor(merchants) {
        this.merchants = merchants;
    }
    onboard(req, dto) {
        return this.merchants.onboardMerchant(req.user.userId, dto);
    }
    me(merchantId) {
        return this.merchants.getMerchant(merchantId);
    }
    createApiKey(merchantId, dto) {
        return this.merchants.createApiKey(merchantId, dto);
    }
};
exports.MerchantsController = MerchantsController;
__decorate([
    (0, common_1.Post)('onboard'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, onboard_merchant_dto_1.OnboardMerchantDto]),
    __metadata("design:returntype", void 0)
], MerchantsController.prototype, "onboard", null);
__decorate([
    (0, common_1.Get)('me'),
    __param(0, (0, merchant_decorator_1.MerchantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MerchantsController.prototype, "me", null);
__decorate([
    (0, common_1.Post)('api-keys'),
    __param(0, (0, merchant_decorator_1.MerchantId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_api_key_dto_1.CreateApiKeyDto]),
    __metadata("design:returntype", void 0)
], MerchantsController.prototype, "createApiKey", null);
exports.MerchantsController = MerchantsController = __decorate([
    (0, swagger_1.ApiTags)('merchants'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('merchants'),
    __metadata("design:paramtypes", [merchants_service_1.MerchantsService])
], MerchantsController);
//# sourceMappingURL=merchants.controller.js.map