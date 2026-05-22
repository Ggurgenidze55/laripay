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
exports.CheckoutController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const api_key_guard_1 = require("../../common/guards/api-key.guard");
const checkout_service_1 = require("./checkout.service");
const create_order_dto_1 = require("./dto/create-order.dto");
const redirect_checkout_dto_1 = require("./dto/redirect-checkout.dto");
const embedded_checkout_dto_1 = require("./dto/embedded-checkout.dto");
const direct_payment_dto_1 = require("./dto/direct-payment.dto");
let CheckoutController = class CheckoutController {
    constructor(checkout) {
        this.checkout = checkout;
    }
    createOrder(req, dto) {
        return this.checkout.createOrder(req.merchantId, dto, req.ip);
    }
    redirect(req, dto) {
        return this.checkout.createRedirectCheckout(req.merchantId, dto, req.ip);
    }
    embedded(req, dto) {
        return this.checkout.createEmbeddedSession(req.merchantId, dto);
    }
    embeddedConfig(token) {
        return this.checkout.getEmbeddedConfig(token);
    }
    direct(req, dto) {
        return this.checkout.processDirectPayment(req.merchantId, dto, req.ip);
    }
    async hostedPage(sessionId, res) {
        const html = await this.checkout.getHostedCheckoutPage(sessionId);
        res.type('html').send(html);
    }
    async hostedPay(sessionId, res) {
        const result = await this.checkout.completeHostedPayment(sessionId);
        res.redirect(302, result.redirect);
    }
    threeDs(intentId, res) {
        res.type('html').send(`<html><body style="font-family:system-ui;background:#0a0a0f;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh">
      <div style="text-align:center"><h1>3D Secure</h1><p>Mock authentication for intent ${intentId}</p>
      <p>Sandbox approved — return to merchant app.</p></div></body></html>`);
    }
};
exports.CheckoutController = CheckoutController;
__decorate([
    (0, swagger_1.ApiSecurity)('api-key'),
    (0, common_1.UseGuards)(api_key_guard_1.ApiKeyGuard),
    (0, common_1.Post)('orders'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_order_dto_1.CreateOrderDto]),
    __metadata("design:returntype", void 0)
], CheckoutController.prototype, "createOrder", null);
__decorate([
    (0, swagger_1.ApiSecurity)('api-key'),
    (0, common_1.UseGuards)(api_key_guard_1.ApiKeyGuard),
    (0, common_1.Post)('checkout/redirect'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, redirect_checkout_dto_1.RedirectCheckoutDto]),
    __metadata("design:returntype", void 0)
], CheckoutController.prototype, "redirect", null);
__decorate([
    (0, swagger_1.ApiSecurity)('api-key'),
    (0, common_1.UseGuards)(api_key_guard_1.ApiKeyGuard),
    (0, common_1.Post)('checkout/embedded'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, embedded_checkout_dto_1.EmbeddedCheckoutDto]),
    __metadata("design:returntype", void 0)
], CheckoutController.prototype, "embedded", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('checkout/embedded/:token/config'),
    __param(0, (0, common_1.Param)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CheckoutController.prototype, "embeddedConfig", null);
__decorate([
    (0, swagger_1.ApiSecurity)('api-key'),
    (0, common_1.UseGuards)(api_key_guard_1.ApiKeyGuard),
    (0, common_1.Post)('checkout/direct'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, direct_payment_dto_1.DirectPaymentDto]),
    __metadata("design:returntype", void 0)
], CheckoutController.prototype, "direct", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('checkout/hosted/:sessionId'),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CheckoutController.prototype, "hostedPage", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('checkout/hosted/:sessionId/pay'),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CheckoutController.prototype, "hostedPay", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('checkout/3ds/:intentId'),
    __param(0, (0, common_1.Param)('intentId')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CheckoutController.prototype, "threeDs", null);
exports.CheckoutController = CheckoutController = __decorate([
    (0, swagger_1.ApiTags)('checkout'),
    (0, common_1.Controller)('v1'),
    __metadata("design:paramtypes", [checkout_service_1.CheckoutService])
], CheckoutController);
//# sourceMappingURL=checkout.controller.js.map