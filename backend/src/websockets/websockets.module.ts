import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WebsocketsGateway } from './websockets.gateway';
import { WebsocketsService } from './websockets.service';
import { TrackingService } from './tracking.service';
import { WebsocketsController } from './websockets.controller';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../database/prisma.module';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: configService.get<string>('JWT_EXPIRES_IN') },
      }),
      inject: [ConfigService],
    }),
    AuthModule,
  ],
  controllers: [WebsocketsController],
  providers: [WebsocketsGateway, WebsocketsService, TrackingService],
  exports: [WebsocketsGateway, WebsocketsService, TrackingService],
})
export class WebsocketsModule {}
