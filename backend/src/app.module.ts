import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './database/prisma.service';

// Feature Modules
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RidesModule } from './rides/rides.module';
import { PaymentsModule } from './payments/payments.module';
import { DriversModule } from './drivers/drivers.module';
import { RidersModule } from './riders/riders.module';
import { MapsModule } from './maps/maps.module';
import { NotificationsModule } from './notifications/notifications.module';
import { LocationsModule } from './locations/locations.module';
import { WebsocketsModule } from './websockets/websockets.module';
import { FinePaymentModule } from './common/modules/fine-payment.module';
import { RoleSwitchingModule } from './common/modules/role-switching.module';
import { DriverVerificationModule } from './common/modules/driver-verification.module';
import { DriverRegistrationModule } from './common/modules/driver-registration.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),
    // Feature Modules
    AuthModule,
    UsersModule,
    RidesModule,
    PaymentsModule,
    DriversModule,
    RidersModule,
    MapsModule,
    NotificationsModule,
            LocationsModule,
            WebsocketsModule,
            FinePaymentModule,
            RoleSwitchingModule,
    DriverVerificationModule,
    DriverRegistrationModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
  exports: [PrismaService],
})
export class AppModule {}