import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { MockProvider } from './providers/mock.provider';
import { FraudModule } from '../fraud/fraud.module';
import { LedgerModule } from '../ledger/ledger.module';

@Module({
  imports: [FraudModule, LedgerModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, MockProvider],
  exports: [PaymentsService],
})
export class PaymentsModule {}
