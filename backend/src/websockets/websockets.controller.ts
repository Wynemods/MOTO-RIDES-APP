import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { WebsocketsService } from './websockets.service';
import { TrackingService } from './tracking.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Real-time')
@Controller('realtime')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WebsocketsController {
  constructor(
    private websocketsService: WebsocketsService,
    private trackingService: TrackingService,
  ) {}

  @Get('status')
  @ApiOperation({ summary: 'Get real-time system status' })
  @ApiResponse({ status: 200, description: 'System status retrieved successfully' })
  async getSystemStatus() {
    const connectedUsers = this.websocketsService.getConnectedUsersCount();
    const activeTrackings = this.trackingService.getTrackingStats();

    return {
      connectedUsers,
      activeTrackings,
      timestamp: new Date(),
    };
  }

  @Get('drivers/nearby')
  @ApiOperation({ summary: 'Get nearby drivers' })
  @ApiResponse({ status: 200, description: 'Nearby drivers retrieved successfully' })
  async getNearbyDrivers(
    @Request() req,
    @Body() body: { lat: number; lng: number; radius?: number }
  ) {
    const nearbyDrivers = await this.trackingService.getNearbyDrivers(
      body.lat,
      body.lng,
      body.radius || 5000
    );

    return {
      drivers: nearbyDrivers,
      count: nearbyDrivers.length,
      timestamp: new Date(),
    };
  }

  @Post('ride/:rideId/track')
  @ApiOperation({ summary: 'Start tracking a ride' })
  @ApiResponse({ status: 200, description: 'Ride tracking started successfully' })
  async startRideTracking(@Param('rideId') rideId: string) {
    await this.trackingService.startRideTracking(rideId);
    return {
      message: 'Ride tracking started',
      rideId,
      timestamp: new Date(),
    };
  }

  @Post('ride/:rideId/stop-track')
  @ApiOperation({ summary: 'Stop tracking a ride' })
  @ApiResponse({ status: 200, description: 'Ride tracking stopped successfully' })
  async stopRideTracking(@Param('rideId') rideId: string) {
    this.trackingService.stopRideTracking(rideId);
    return {
      message: 'Ride tracking stopped',
      rideId,
      timestamp: new Date(),
    };
  }

  @Get('tracking/active')
  @ApiOperation({ summary: 'Get active trackings' })
  @ApiResponse({ status: 200, description: 'Active trackings retrieved successfully' })
  async getActiveTrackings() {
    const activeTrackings = this.trackingService.getActiveTrackings();
    return {
      activeTrackings,
      count: activeTrackings.length,
      timestamp: new Date(),
    };
  }

  @Post('notification/send')
  @ApiOperation({ summary: 'Send notification to user' })
  @ApiResponse({ status: 200, description: 'Notification sent successfully' })
  async sendNotification(
    @Body() body: {
      userId: string;
      title: string;
      message: string;
      type: 'ride' | 'payment' | 'system' | 'emergency' | 'promotion';
      data?: any;
    }
  ) {
    // Map notification types to websocket types
    const mapType = (type: string): 'info' | 'success' | 'warning' | 'error' => {
      if (type === 'ride') return 'info';
      if (type === 'payment') return 'success';
      if (type === 'system') return 'warning';
      if (type === 'emergency') return 'error';
      if (type === 'promotion') return 'info';
      return 'info';
    };

    await this.websocketsService.sendNotification({
      userId: body.userId,
      title: body.title,
      message: body.message,
      type: mapType(body.type),
      data: body.data,
    });

    return {
      message: 'Notification sent successfully',
      timestamp: new Date(),
    };
  }

  @Post('announcement/send')
  @ApiOperation({ summary: 'Send system announcement' })
  @ApiResponse({ status: 200, description: 'Announcement sent successfully' })
  async sendAnnouncement(
    @Body() body: {
      title: string;
      message: string;
      targetUsers?: string[];
    }
  ) {
    await this.websocketsService.sendAnnouncement(
      body.title,
      body.message,
      body.targetUsers
    );

    return {
      message: 'Announcement sent successfully',
      timestamp: new Date(),
    };
  }

  @Get('driver/:driverId/location')
  @ApiOperation({ summary: 'Get driver current location' })
  @ApiResponse({ status: 200, description: 'Driver location retrieved successfully' })
  async getDriverLocation(@Param('driverId') driverId: string) {
    const location = this.trackingService['websocketsService']['websocketsGateway'].getDriverLocation(driverId);
    
    if (!location) {
      return {
        message: 'Driver location not available',
        driverId,
      };
    }

    return {
      driverId,
      location,
      timestamp: new Date(),
    };
  }

  @Post('driver/:driverId/location')
  @ApiOperation({ summary: 'Update driver location' })
  @ApiResponse({ status: 200, description: 'Driver location updated successfully' })
  async updateDriverLocation(
    @Param('driverId') driverId: string,
    @Body() body: {
      lat: number;
      lng: number;
      heading?: number;
      speed?: number;
    }
  ) {
    await this.trackingService.updateDriverLocation(
      driverId,
      body.lat,
      body.lng,
      body.heading,
      body.speed
    );

    return {
      message: 'Driver location updated successfully',
      driverId,
      timestamp: new Date(),
    };
  }
}
