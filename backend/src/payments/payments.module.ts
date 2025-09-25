import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { MpesaService } from './services/mpesa.service';
import { StripeService } from './services/stripe.service';
import { WalletService } from './services/wallet.service';
import { PrismaModule } from '../database/prisma.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, MpesaService, StripeService, WalletService],
  exports: [PaymentsService, MpesaService, StripeService, WalletService],
})
export class PaymentsModule {}
