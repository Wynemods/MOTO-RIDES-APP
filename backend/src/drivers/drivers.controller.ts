import { Controller, Get, Post, Body, UseGuards, Request, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RidesService } from '../rides/rides.service';
import { RoleValidationService } from '../common/services/role-validation.service';
import { CreateRatingDto } from '../rides/dto/rating.dto';

@ApiTags('Driver Services')
@Controller('drivers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('driver')
@ApiBearerAuth()
export class DriversController {
  constructor(
    private readonly ridesService: RidesService,
    private readonly roleValidationService: RoleValidationService,
  ) {}

  @Get('ride-requests')
  @ApiOperation({ summary: 'Get available ride requests (Driver only)' })
  @ApiResponse({ status: 200, description: 'Ride requests retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Access denied - Driver role required' })
  async getRideRequests(@CurrentUser() user: any) {
    // Validate driver has active profile
    await this.roleValidationService.isDriverWithProfile(user.id);
    
    return { message: 'Available ride requests - requires location and availability logic' };
  }

  @Post('accept-ride/:rideId')
  @ApiOperation({ summary: 'Accept a ride request (Driver only)' })
  @ApiResponse({ status: 200, description: 'Ride accepted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid ride acceptance' })
  async acceptRide(@CurrentUser() user: any, @Param('rideId') rideId: string) {
    await this.roleValidationService.isDriverWithProfile(user.id);
    
    return this.ridesService.acceptRide(rideId, user.driverId);
  }

  @Post('decline-ride/:rideId')
  @ApiOperation({ summary: 'Decline a ride request (Driver only)' })
  @ApiResponse({ status: 200, description: 'Ride declined successfully' })
  @ApiResponse({ status: 400, description: 'Invalid ride decline' })
  async declineRide(@CurrentUser() user: any, @Param('rideId') rideId: string, @Body() body: { reason?: string }) {
    await this.roleValidationService.isDriverWithProfile(user.id);
    
    return this.ridesService.declineRide(rideId, user.driverId, body.reason);
  }

  @Post('start-ride/:rideId')
  @ApiOperation({ summary: 'Start a ride (Driver only)' })
  @ApiResponse({ status: 200, description: 'Ride started successfully' })
  @ApiResponse({ status: 400, description: 'Invalid ride start' })
  async startRide(@CurrentUser() user: any, @Param('rideId') rideId: string) {
    await this.roleValidationService.isDriverWithProfile(user.id);
    
    return this.ridesService.startRide(rideId, user.driverId);
  }

  @Post('complete-ride/:rideId')
  @ApiOperation({ summary: 'Complete a ride (Driver only)' })
  @ApiResponse({ status: 200, description: 'Ride completed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid ride completion' })
  async completeRide(@CurrentUser() user: any, @Param('rideId') rideId: string) {
    await this.roleValidationService.isDriverWithProfile(user.id);
    
    return this.ridesService.completeRide(rideId, user.driverId);
  }

  @Post('rate-passenger')
  @ApiOperation({ summary: 'Rate passenger after ride (Driver only)' })
  @ApiResponse({ status: 201, description: 'Passenger rated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid rating data' })
  async ratePassenger(@CurrentUser() user: any, @Body() ratingDto: CreateRatingDto) {
    await this.roleValidationService.isDriverWithProfile(user.id);
    
    return this.ridesService.rateRide(ratingDto, user.id);
  }

  @Get('earnings')
  @ApiOperation({ summary: 'Get driver earnings (Driver only)' })
  @ApiResponse({ status: 200, description: 'Earnings retrieved successfully' })
  async getEarnings(@CurrentUser() user: any) {
    await this.roleValidationService.isDriverWithProfile(user.id);
    
    return this.ridesService.getDriverEarnings(user.driverId);
  }

  @Get('ride-history')
  @ApiOperation({ summary: 'Get driver ride history (Driver only)' })
  @ApiResponse({ status: 200, description: 'Ride history retrieved successfully' })
  async getRideHistory(@CurrentUser() user: any) {
    await this.roleValidationService.isDriverWithProfile(user.id);
    
    return this.ridesService.getDriverRideHistory(user.driverId);
  }

  @Post('update-location')
  @ApiOperation({ summary: 'Update driver location (Driver only)' })
  @ApiResponse({ status: 200, description: 'Location updated successfully' })
  async updateLocation(@CurrentUser() user: any, @Body() body: { 
    latitude: number; 
    longitude: number; 
    heading?: number;
    speed?: number;
  }) {
    await this.roleValidationService.isDriverWithProfile(user.id);
    
    return this.ridesService.updateDriverLocation(user.driverId, {
      latitude: body.latitude,
      longitude: body.longitude,
      heading: body.heading,
      speed: body.speed,
    });
  }

  @Post('set-availability')
  @ApiOperation({ summary: 'Set driver availability status (Driver only)' })
  @ApiResponse({ status: 200, description: 'Availability updated successfully' })
  async setAvailability(@CurrentUser() user: any, @Body() body: { 
    isAvailable: boolean; 
    reason?: string 
  }) {
    await this.roleValidationService.isDriverWithProfile(user.id);
    
    return this.ridesService.setDriverAvailability(user.driverId, body.isAvailable, body.reason);
  }

  @Get('penalty-status')
  @ApiOperation({ summary: 'Get driver penalty status (Driver only)' })
  @ApiResponse({ status: 200, description: 'Penalty status retrieved successfully' })
  async getPenaltyStatus(@CurrentUser() user: any) {
    await this.roleValidationService.isDriverWithProfile(user.id);
    
    return this.ridesService.getDriverPenaltyStatus(user.driverId);
  }
}