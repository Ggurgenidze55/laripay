import { Module } from '@nestjs/common';
import { OpenBankingController } from './open-banking.controller';
import { OpenBankingService } from './open-banking.service';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [PaymentsModule],
  controllers: [OpenBankingController],
  providers: [OpenBankingService],
})
export class OpenBankingModule {}
