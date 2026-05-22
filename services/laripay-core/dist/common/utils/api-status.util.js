"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapPaymentStatus = mapPaymentStatus;
exports.mapOrderStatus = mapOrderStatus;
const client_1 = require("@prisma/client");
function mapPaymentStatus(status) {
    if (status === client_1.PaymentStatus.SUCCEEDED)
        return 'approved';
    return status.toLowerCase();
}
function mapOrderStatus(status) {
    return status.toLowerCase();
}
//# sourceMappingURL=api-status.util.js.map