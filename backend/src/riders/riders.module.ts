import { Module } from '@nestjs/common';
import { RidersController } from './riders.controller';
import { RidesModule } from '../rides/rides.module';
import { FinePaymentModule } from '../common/modules/fine-payment.module';

@Module({
  imports: [RidesModule, FinePaymentModule],
  controllers: [RidersController],
})
export class RidersModule {}
