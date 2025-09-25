import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RidesService } from '../rides/rides.service';
import { CancellationFineService } from '../common/services/cancellation-fine.service';
import { CreateRideDto } from '../rides/dto/create-ride.dto';
import { CreateRatingDto } from '../rides/dto/rating.dto';

@ApiTags('Rider Services')
@Controller('riders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('rider')
@ApiBearerAuth()
export class RidersController {
  constructor(
    private readonly ridesService: RidesService,
    private readonly cancellationFineService: CancellationFineService,
  ) {}

  @Post('request-ride')
  @ApiOperation({ summary: 'Request a ride (Rider only)' })
  @ApiResponse({ status: 201, description: 'Ride requested successfully' })
  @ApiResponse({ status: 400, description: 'Invalid ride request' })
  @ApiResponse({ status: 403, description: 'Access denied - Rider role required' })
  async requestRide(@CurrentUser() user: any, @Body() createRideDto: CreateRideDto) {
    return this.ridesService.createRide(user.id, createRideDto);
  }

  @Get('nearby-drivers')
  @ApiOperation({ summary: 'Get nearby drivers (Rider only)' })
  @ApiResponse({ status: 200, description: 'Nearby drivers retrieved successfully' })
  async getNearbyDrivers(@CurrentUser() user: any) {
    // This would typically require a location parameter
    return { message: 'Nearby drivers feature - requires location data' };
  }

  @Post('fare-estimate')
  @ApiOperation({ summary: 'Get fare estimate (Rider only)' })
  @ApiResponse({ status: 200, description: 'Fare estimate calculated successfully' })
  async getFareEstimate(@CurrentUser() user: any, @Body() body: { 
    pickup: any; 
    destination: any; 
    rideType?: string 
  }) {
    return this.ridesService.calculateFareEstimate(
      body.pickup,
      body.destination,
      body.rideType as any
    );
  }

  @Post('rate-driver')
  @ApiOperation({ summary: 'Rate driver after ride (Rider only)' })
  @ApiResponse({ status: 201, description: 'Driver rated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid rating data' })
  async rateDriver(@CurrentUser() user: any, @Body() ratingDto: CreateRatingDto) {
    return this.ridesService.rateRide(ratingDto, user.id);
  }

  @Get('ride-history')
  @ApiOperation({ summary: 'Get ride history (Rider only)' })
  @ApiResponse({ status: 200, description: 'Ride history retrieved successfully' })
  async getRideHistory(@CurrentUser() user: any) {
    return this.ridesService.getRideHistory(user.id);
  }

  @Get('fine-status')
  @ApiOperation({ summary: 'Get cancellation fine status (Rider only)' })
  @ApiResponse({ status: 200, description: 'Fine status retrieved successfully' })
  async getFineStatus(@CurrentUser() user: any) {
    return this.cancellationFineService.getFineStatus(user.id);
  }

  @Post('cancel-ride/:rideId')
  @ApiOperation({ summary: 'Cancel a ride (Rider only)' })
  @ApiResponse({ status: 200, description: 'Ride cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Invalid cancellation request' })
  async cancelRide(@CurrentUser() user: any, @Param('rideId') rideId: string, @Body() body: { reason?: string }) {
    return this.ridesService.cancelRide(rideId, user.id, body.reason);
  }

  @Get('payment-methods')
  @ApiOperation({ summary: 'Get available payment methods (Rider only)' })
  @ApiResponse({ status: 200, description: 'Payment methods retrieved successfully' })
  async getPaymentMethods(@CurrentUser() user: any) {
    return {
      methods: [
        { id: 'cash', name: 'Cash', description: 'Pay with cash' },
        { id: 'mpesa', name: 'M-Pesa', description: 'Pay via M-Pesa' },
        { id: 'wallet', name: 'Wallet', description: 'Pay from wallet' },
        { id: 'card', name: 'Card', description: 'Pay with card' },
      ]
    };
  }
}
