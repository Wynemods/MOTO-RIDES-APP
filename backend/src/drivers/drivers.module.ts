import { Module } from '@nestjs/common';
import { DriversController } from './drivers.controller';
import { RidesModule } from '../rides/rides.module';
import { PrismaModule } from '../database/prisma.module';
import { RoleValidationService } from '../common/services/role-validation.service';

@Module({
  imports: [RidesModule, PrismaModule],
  controllers: [DriversController],
  providers: [RoleValidationService],
  exports: [RoleValidationService],
})
export class DriversModule {}