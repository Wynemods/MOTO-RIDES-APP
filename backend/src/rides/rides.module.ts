import { Module } from '@nestjs/common';
import { RidesService } from './rides.service';
import { RidesController } from './rides.controller';
import { PrismaModule } from '../database/prisma.module';
import { PaymentsModule } from '../payments/payments.module';
import { FareCalculationService } from '../common/services/fare-calculation.service';
import { FareValidationService } from '../common/services/fare-validation.service';
import { EdgeCaseService } from '../common/services/edge-case.service';
import { CancellationFineService } from '../common/services/cancellation-fine.service';
import { CashPaymentService } from '../common/services/cash-payment.service';
import { SplitFareService } from '../common/services/split-fare.service';
import { DistanceCalculationService } from '../common/services/distance-calculation.service';
import { GPSTrackingService } from '../common/services/gps-tracking.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, PaymentsModule, NotificationsModule],
  controllers: [RidesController],
  providers: [RidesService, FareCalculationService, FareValidationService, EdgeCaseService, CancellationFineService, CashPaymentService, SplitFareService, DistanceCalculationService, GPSTrackingService],
  exports: [RidesService, FareCalculationService, FareValidationService, EdgeCaseService, CancellationFineService, CashPaymentService, SplitFareService, DistanceCalculationService, GPSTrackingService],
})
export class RidesModule {}
