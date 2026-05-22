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
exports.WebhooksController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const api_key_guard_1 = require("../../common/guards/api-key.guard");
const webhooks_service_1 = require("./webhooks.service");
const register_endpoint_dto_1 = require("./dto/register-endpoint.dto");
let WebhooksController = class WebhooksController {
    constructor(webhooks) {
        this.webhooks = webhooks;
    }
    register(req, dto) {
        return this.webhooks.registerEndpoint(req.merchantId, dto);
    }
    listEndpoints(req) {
        return this.webhooks.listEndpoints(req.merchantId);
    }
    listDeliveries(req) {
        return this.webhooks.listDeliveries(req.merchantId);
    }
};
exports.WebhooksController = WebhooksController;
__decorate([
    (0, common_1.Post)('endpoints'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, register_endpoint_dto_1.RegisterEndpointDto]),
    __metadata("design:returntype", void 0)
], WebhooksController.prototype, "register", null);
__decorate([
    (0, common_1.Get)('endpoints'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], WebhooksController.prototype, "listEndpoints", null);
__decorate([
    (0, common_1.Get)('deliveries'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], WebhooksController.prototype, "listDeliveries", null);
exports.WebhooksController = WebhooksController = __decorate([
    (0, swagger_1.ApiTags)('webhooks'),
    (0, swagger_1.ApiSecurity)('api-key'),
    (0, common_1.UseGuards)(api_key_guard_1.ApiKeyGuard),
    (0, common_1.Controller)('v1/webhooks'),
    __metadata("design:paramtypes", [webhooks_service_1.WebhooksService])
], WebhooksController);
//# sourceMappingURL=webhooks.controller.js.map