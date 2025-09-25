import { Module } from '@nestjs/common';
import { DriverRegistrationService } from '../services/driver-registration.service';
import { DriverRegistrationController } from '../controllers/driver-registration.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [DriverRegistrationService],
  controllers: [DriverRegistrationController],
  exports: [DriverRegistrationService]
})
export class DriverRegistrationModule {}
