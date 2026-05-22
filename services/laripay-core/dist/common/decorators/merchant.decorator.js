"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrentMerchant = exports.MerchantId = void 0;
const common_1 = require("@nestjs/common");
exports.MerchantId = (0, common_1.createParamDecorator)((_data, ctx) => {
    const req = ctx.switchToHttp().getRequest();
    return req.merchantId ?? req.user?.merchantId;
});
exports.CurrentMerchant = (0, common_1.createParamDecorator)((_data, ctx) => {
    const req = ctx.switchToHttp().getRequest();
    return req.merchant;
});
//# sourceMappingURL=merchant.decorator.js.map