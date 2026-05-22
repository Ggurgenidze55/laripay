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
exports.PaymentsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const api_key_guard_1 = require("../../common/guards/api-key.guard");
const payments_service_1 = require("./payments.service");
const create_intent_dto_1 = require("./dto/create-intent.dto");
const create_checkout_session_dto_1 = require("./dto/create-checkout-session.dto");
let PaymentsController = class PaymentsController {
    constructor(payments) {
        this.payments = payments;
    }
    createIntent(req, dto, idempotencyKey) {
        return this.payments.createIntent(req.merchantId, dto, idempotencyKey, req.ip);
    }
    getIntent(req, id) {
        return this.payments.getIntent(req.merchantId, id);
    }
    authorize(req, id) {
        return this.payments.authorize(req.merchantId, id, req.ip);
    }
    capture(req, id) {
        return this.payments.capture(req.merchantId, id);
    }
    refund(req, id, body) {
        return this.payments.refund(req.merchantId, id, body?.amount);
    }
    createLink(req, body) {
        return this.payments.createPaymentLink(req.merchantId, body.amount, body.currency);
    }
    checkoutSession(req, dto, idempotencyKey) {
        return this.payments.createCheckoutSession(req.merchantId, dto, idempotencyKey, req.ip);
    }
};
exports.PaymentsController = PaymentsController;
__decorate([
    (0, common_1.Post)('v1/payment-intents'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)('idempotency-key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_intent_dto_1.CreateIntentDto, String]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "createIntent", null);
__decorate([
    (0, common_1.Get)('v1/payment-intents/:id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "getIntent", null);
__decorate([
    (0, common_1.Post)('v1/payment-intents/:id/authorize'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "authorize", null);
__decorate([
    (0, common_1.Post)('v1/payment-intents/:id/capture'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "capture", null);
__decorate([
    (0, common_1.Post)('v1/payments/:id/refund'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "refund", null);
__decorate([
    (0, common_1.Post)('v1/payment-links'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "createLink", null);
__decorate([
    (0, common_1.Post)('v1/checkout/sessions'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)('idempotency-key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_checkout_session_dto_1.CreateCheckoutSessionDto, String]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "checkoutSession", null);
exports.PaymentsController = PaymentsController = __decorate([
    (0, swagger_1.ApiTags)('payments'),
    (0, swagger_1.ApiSecurity)('api-key'),
    (0, common_1.UseGuards)(api_key_guard_1.ApiKeyGuard),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [payments_service_1.PaymentsService])
], PaymentsController);
//# sourceMappingURL=payments.controller.js.map