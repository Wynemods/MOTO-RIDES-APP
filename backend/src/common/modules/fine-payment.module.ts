import { Module } from '@nestjs/common';
import { FinePaymentController } from '../controllers/fine-payment.controller';
import { CancellationFineService } from '../services/cancellation-fine.service';
import { PrismaModule } from '../../database/prisma.module';
import { NotificationsModule } from '../../notifications/notifications.module';
import { PaymentsModule } from '../../payments/payments.module';

@Module({
  imports: [PrismaModule, NotificationsModule, PaymentsModule],
  controllers: [FinePaymentController],
  providers: [CancellationFineService],
  exports: [CancellationFineService],
})
export class FinePaymentModule {}
