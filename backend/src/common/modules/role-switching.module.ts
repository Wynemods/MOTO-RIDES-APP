import { Module } from '@nestjs/common';
import { RoleSwitchingController } from '../controllers/role-switching.controller';
import { RoleSwitchingService } from '../services/role-switching.service';
import { PrismaModule } from '../../database/prisma.module';
import { NotificationsModule } from '../../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [RoleSwitchingController],
  providers: [RoleSwitchingService],
  exports: [RoleSwitchingService],
})
export class RoleSwitchingModule {}
