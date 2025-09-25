import { Module } from '@nestjs/common';
import { DriverVerificationController } from '../controllers/driver-verification.controller';
import { DriverVerificationService } from '../services/driver-verification.service';
import { PrismaModule } from '../../database/prisma.module';
import { NotificationsModule } from '../../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [DriverVerificationController],
  providers: [DriverVerificationService],
  exports: [DriverVerificationService],
})
export class DriverVerificationModule {}
