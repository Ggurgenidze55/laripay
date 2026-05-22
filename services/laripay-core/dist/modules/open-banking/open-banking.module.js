"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenBankingModule = void 0;
const common_1 = require("@nestjs/common");
const open_banking_controller_1 = require("./open-banking.controller");
const open_banking_service_1 = require("./open-banking.service");
const payments_module_1 = require("../payments/payments.module");
let OpenBankingModule = class OpenBankingModule {
};
exports.OpenBankingModule = OpenBankingModule;
exports.OpenBankingModule = OpenBankingModule = __decorate([
    (0, common_1.Module)({
        imports: [payments_module_1.PaymentsModule],
        controllers: [open_banking_controller_1.OpenBankingController],
        providers: [open_banking_service_1.OpenBankingService],
    })
], OpenBankingModule);
//# sourceMappingURL=open-banking.module.js.map