"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const configuration_1 = require("./config/configuration");
const prisma_module_1 = require("./prisma/prisma.module");
const jwt_auth_guard_1 = require("./common/guards/jwt-auth.guard");
const health_module_1 = require("./modules/health/health.module");
const auth_module_1 = require("./modules/auth/auth.module");
const merchants_module_1 = require("./modules/merchants/merchants.module");
const payments_module_1 = require("./modules/payments/payments.module");
const ledger_module_1 = require("./modules/ledger/ledger.module");
const webhooks_module_1 = require("./modules/webhooks/webhooks.module");
const payouts_module_1 = require("./modules/payouts/payouts.module");
const subscriptions_module_1 = require("./modules/subscriptions/subscriptions.module");
const fraud_module_1 = require("./modules/fraud/fraud.module");
const admin_module_1 = require("./modules/admin/admin.module");
const events_module_1 = require("./modules/events/events.module");
const checkout_module_1 = require("./modules/checkout/checkout.module");
const open_banking_module_1 = require("./modules/open-banking/open-banking.module");
const wallets_module_1 = require("./modules/wallets/wallets.module");
const customers_module_1 = require("./modules/customers/customers.module");
const tokens_module_1 = require("./modules/tokens/tokens.module");
const qr_module_1 = require("./modules/qr/qr.module");
const signature_module_1 = require("./common/signature/signature.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true, load: [configuration_1.default] }),
            throttler_1.ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
            prisma_module_1.PrismaModule,
            signature_module_1.SignatureModule,
            events_module_1.EventsModule,
            health_module_1.HealthModule,
            auth_module_1.AuthModule,
            merchants_module_1.MerchantsModule,
            fraud_module_1.FraudModule,
            ledger_module_1.LedgerModule,
            webhooks_module_1.WebhooksModule,
            payments_module_1.PaymentsModule,
            checkout_module_1.CheckoutModule,
            open_banking_module_1.OpenBankingModule,
            wallets_module_1.WalletsModule,
            customers_module_1.CustomersModule,
            tokens_module_1.TokensModule,
            qr_module_1.QrModule,
            payouts_module_1.PayoutsModule,
            subscriptions_module_1.SubscriptionsModule,
            admin_module_1.AdminModule,
        ],
        providers: [
            { provide: core_1.APP_GUARD, useClass: jwt_auth_guard_1.JwtAuthGuard },
            { provide: core_1.APP_GUARD, useClass: throttler_1.ThrottlerGuard },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map