import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import configuration from './config/configuration';
import { PrismaModule } from './prisma/prisma.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { MerchantsModule } from './modules/merchants/merchants.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { LedgerModule } from './modules/ledger/ledger.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { PayoutsModule } from './modules/payouts/payouts.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { FraudModule } from './modules/fraud/fraud.module';
import { AdminModule } from './modules/admin/admin.module';
import { EventsModule } from './modules/events/events.module';
import { CheckoutModule } from './modules/checkout/checkout.module';
import { OpenBankingModule } from './modules/open-banking/open-banking.module';
import { WalletsModule } from './modules/wallets/wallets.module';
import { CustomersModule } from './modules/customers/customers.module';
import { TokensModule } from './modules/tokens/tokens.module';
import { QrModule } from './modules/qr/qr.module';
import { SignatureModule } from './common/signature/signature.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    PrismaModule,
    SignatureModule,
    EventsModule,
    HealthModule,
    AuthModule,
    MerchantsModule,
    FraudModule,
    LedgerModule,
    WebhooksModule,
    PaymentsModule,
    CheckoutModule,
    OpenBankingModule,
    WalletsModule,
    CustomersModule,
    TokensModule,
    QrModule,
    PayoutsModule,
    SubscriptionsModule,
    AdminModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
