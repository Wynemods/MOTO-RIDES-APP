import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MapsService } from './maps.service';
import { MapsController } from './maps.controller';
import { OpenStreetMapService } from './openstreetmap.service';

@Module({
  imports: [ConfigModule],
  controllers: [MapsController],
  providers: [MapsService, OpenStreetMapService],
  exports: [MapsService],
})
export class MapsModule {}
