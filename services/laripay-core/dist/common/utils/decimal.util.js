"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decimalToNumber = decimalToNumber;
exports.toDecimal = toDecimal;
const library_1 = require("@prisma/client/runtime/library");
function decimalToNumber(value) {
    if (value == null)
        return 0;
    return Number(value.toString());
}
function toDecimal(value) {
    return new library_1.Decimal(value);
}
//# sourceMappingURL=decimal.util.js.map