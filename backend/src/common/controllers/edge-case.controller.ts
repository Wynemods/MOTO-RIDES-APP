import { Controller, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EdgeCaseService } from '../services/edge-case.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

export class CancelRideDto {
  rideId: string;
  reason?: string;
}

export class ChangeDestinationDto {
  rideId: string;
  destination: {
    lat: number;
    lng: number;
    address: string;
  };
}

export class EmergencyDto {
  rideId: string;
  emergencyType: 'police' | 'helpline' | 'admin';
}

@ApiTags('Edge Cases')
@Controller('edge-cases')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EdgeCaseController {
  constructor(private readonly edgeCaseService: EdgeCaseService) {}

  @Post('cancel-ride')
  @ApiOperation({ summary: 'Cancel a ride (passenger)' })
  @ApiResponse({ status: 200, description: 'Ride cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Invalid cancellation request' })
  async cancelRide(@Request() req, @Body() cancelDto: CancelRideDto) {
    return this.edgeCaseService.handlePassengerCancellation(
      cancelDto.rideId,
      req.user.id,
      cancelDto.reason
    );
  }

  @Post('driver-cancel')
  @ApiOperation({ summary: 'Cancel a ride (driver)' })
  @ApiResponse({ status: 200, description: 'Ride cancelled by driver' })
  @ApiResponse({ status: 400, description: 'Invalid cancellation request' })
  async driverCancelRide(@Request() req, @Body() cancelDto: CancelRideDto) {
    return this.edgeCaseService.handleDriverCancellation(
      cancelDto.rideId,
      req.user.driverId,
      cancelDto.reason
    );
  }

  @Post('no-show')
  @ApiOperation({ summary: 'Report passenger no-show' })
  @ApiResponse({ status: 200, description: 'No-show reported successfully' })
  @ApiResponse({ status: 400, description: 'Invalid no-show report' })
  async reportNoShow(@Request() req, @Body() body: { rideId: string }) {
    return this.edgeCaseService.handlePassengerNoShow(
      body.rideId,
      req.user.driverId
    );
  }

  @Post('change-destination')
  @ApiOperation({ summary: 'Change destination mid-ride' })
  @ApiResponse({ status: 200, description: 'Destination changed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid destination change' })
  async changeDestination(@Request() req, @Body() changeDto: ChangeDestinationDto) {
    return this.edgeCaseService.handleDestinationChange(
      changeDto.rideId,
      changeDto.destination,
      req.user.driverId
    );
  }

  @Post('emergency')
  @ApiOperation({ summary: 'Report emergency situation' })
  @ApiResponse({ status: 200, description: 'Emergency reported successfully' })
  @ApiResponse({ status: 400, description: 'Invalid emergency report' })
  async reportEmergency(@Request() req, @Body() emergencyDto: EmergencyDto) {
    return this.edgeCaseService.handleEmergency(
      emergencyDto.rideId,
      req.user.id,
      emergencyDto.emergencyType
    );
  }

  @Post('retry-driver-search')
  @ApiOperation({ summary: 'Retry driver search after no drivers found' })
  @ApiResponse({ status: 200, description: 'Driver search retried' })
  @ApiResponse({ status: 400, description: 'Invalid retry request' })
  async retryDriverSearch(@Request() req, @Body() body: { rideId: string }) {
    // This would trigger a new driver search
    return {
      status: 'searching',
      message: 'Searching for drivers...',
      rideId: body.rideId,
    };
  }
}
