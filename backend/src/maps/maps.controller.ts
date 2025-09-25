import {
  Controller,
  Get,
  Query,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MapsService } from './maps.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Maps')
@Controller('maps')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MapsController {
  constructor(private readonly mapsService: MapsService) {}

  @Get('geocode')
  @ApiOperation({ summary: 'Geocode an address to get coordinates' })
  @ApiResponse({ status: 200, description: 'Address geocoded successfully' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  async geocodeAddress(@Query('address') address: string) {
    return this.mapsService.geocodeAddress(address);
  }

  @Get('reverse-geocode')
  @ApiOperation({ summary: 'Reverse geocode coordinates to get address' })
  @ApiResponse({ status: 200, description: 'Coordinates reverse geocoded successfully' })
  @ApiResponse({ status: 404, description: 'Location not found' })
  async reverseGeocode(
    @Query('lat') latitude: number,
    @Query('lng') longitude: number,
  ) {
    return this.mapsService.reverseGeocode(latitude, longitude);
  }

  @Get('search-places')
  @ApiOperation({ summary: 'Search for places using text query' })
  @ApiResponse({ status: 200, description: 'Places found successfully' })
  async searchPlaces(
    @Query('query') query: string,
    @Query('lat') latitude?: number,
    @Query('lng') longitude?: number,
  ) {
    const location = latitude && longitude ? { lat: latitude, lng: longitude } : undefined;
    return this.mapsService.searchPlaces(query, location);
  }

  @Get('place-details')
  @ApiOperation({ summary: 'Get place details by place ID' })
  @ApiResponse({ status: 200, description: 'Place details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Place not found' })
  async getPlaceDetails(@Query('placeId') placeId: string) {
    return this.mapsService.getPlaceDetails(placeId);
  }

  @Post('route')
  @ApiOperation({ summary: 'Calculate route between two points' })
  @ApiResponse({ status: 200, description: 'Route calculated successfully' })
  @ApiResponse({ status: 404, description: 'Route not found' })
  async getRoute(
    @Body() body: {
      origin: { lat: number; lng: number };
      destination: { lat: number; lng: number };
      mode?: 'driving' | 'walking' | 'bicycling';
    },
  ) {
    return this.mapsService.getRoute(body.origin, body.destination, body.mode);
  }

  @Post('distance-matrix')
  @ApiOperation({ summary: 'Calculate distance matrix between multiple points' })
  @ApiResponse({ status: 200, description: 'Distance matrix calculated successfully' })
  async getDistanceMatrix(
    @Body() body: {
      origins: Array<{ lat: number; lng: number }>;
      destinations: Array<{ lat: number; lng: number }>;
    },
  ) {
    return this.mapsService.getDistanceMatrix(body.origins, body.destinations);
  }

  @Get('nearby-drivers')
  @ApiOperation({ summary: 'Find nearby drivers' })
  @ApiResponse({ status: 200, description: 'Nearby drivers found successfully' })
  async findNearbyDrivers(
    @Query('lat') latitude: number,
    @Query('lng') longitude: number,
    @Query('radius') radius?: number,
  ) {
    return this.mapsService.findNearbyDrivers(
      { lat: latitude, lng: longitude },
      radius,
    );
  }
}
