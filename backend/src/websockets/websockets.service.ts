import { Injectable, Logger } from '@nestjs/common';
import { WebsocketsGateway } from './websockets.gateway';
import { PrismaService } from '../database/prisma.service';

export interface LocationUpdate {
  userId: string;
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  timestamp: Date;
}

export interface RideUpdate {
  rideId: string;
  status: string;
  driverId?: string;
  riderId?: string;
  location?: { lat: number; lng: number };
  eta?: number;
  timestamp: Date;
}

export interface NotificationData {
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  data?: any;
}

@Injectable()
export class WebsocketsService {
  private readonly logger = new Logger(WebsocketsService.name);

  constructor(
    private websocketsGateway: WebsocketsGateway,
    private prisma: PrismaService,
  ) {}

  /**
   * Send location update to relevant users
   */
  async sendLocationUpdate(update: LocationUpdate) {
    try {
      // Update driver location in gateway
      this.websocketsGateway.getDriverLocation(update.userId);
      
      // Broadcast to all riders if it's a driver
      const user = await this.prisma.user.findUnique({
        where: { id: update.userId },
        include: { driver: true },
      });

      if (user?.driver) {
        this.websocketsGateway.notifyRiders('driver:location:update', {
          driverId: update.userId,
          lat: update.lat,
          lng: update.lng,
          heading: update.heading,
          speed: update.speed,
          timestamp: update.timestamp,
        });
      }

      this.logger.debug(`Location update sent for user ${update.userId}`);
    } catch (error) {
      this.logger.error('Error sending location update:', error);
    }
  }

  /**
   * Send ride status update
   */
  async sendRideUpdate(update: RideUpdate) {
    try {
      // Get ride details
      const ride = await this.prisma.ride.findUnique({
        where: { id: update.rideId },
        include: { rider: true, driver: true },
      });

      if (!ride) {
        this.logger.warn(`Ride ${update.rideId} not found`);
        return;
      }

      // Update ride status in database
      const updateData: any = { status: update.status as any };
      if (update.driverId) updateData.driverId = update.driverId;
      if (update.location) {
        updateData.currentLat = update.location.lat;
        updateData.currentLng = update.location.lng;
      }
      
      await this.prisma.ride.update({
        where: { id: update.rideId },
        data: updateData,
      });

      // Notify both rider and driver
      if (ride.rider) {
        this.websocketsGateway.notifyUser(ride.rider.id, 'ride:status:update', {
          rideId: update.rideId,
          status: update.status,
          driverId: ride.driver?.id,
          location: update.location,
          eta: update.eta,
          timestamp: update.timestamp,
        });
      }

      if (ride.driver) {
        this.websocketsGateway.notifyUser(ride.driver.id, 'ride:status:update', {
          rideId: update.rideId,
          status: update.status,
          riderId: ride.rider.id,
          location: update.location,
          eta: update.eta,
          timestamp: update.timestamp,
        });
      }

      this.logger.log(`Ride update sent for ride ${update.rideId}: ${update.status}`);
    } catch (error) {
      this.logger.error('Error sending ride update:', error);
    }
  }

  /**
   * Send notification to user
   */
  async sendNotification(notification: NotificationData) {
    try {
      this.websocketsGateway.notifyUser(notification.userId, 'notification:new', {
        title: notification.title,
        message: notification.message,
        type: notification.type,
        data: notification.data,
        timestamp: new Date(),
      });

      this.logger.log(`Notification sent to user ${notification.userId}`);
    } catch (error) {
      this.logger.error('Error sending notification:', error);
    }
  }

  /**
   * Send ride request to nearby drivers
   */
  async sendRideRequest(rideId: string, riderId: string, pickup: any, destination: any, fare: number) {
    try {
      this.websocketsGateway.notifyDrivers('ride:request:new', {
        rideId,
        riderId,
        pickup,
        destination,
        fare,
        timestamp: new Date(),
      });

      this.logger.log(`Ride request sent for ride ${rideId}`);
    } catch (error) {
      this.logger.error('Error sending ride request:', error);
    }
  }

  /**
   * Send driver acceptance notification
   */
  async sendDriverAcceptance(rideId: string, driverId: string, riderId: string) {
    try {
      // Get driver details
      const driver = await this.prisma.driver.findUnique({
        where: { id: driverId },
        include: { user: true },
      });

      if (!driver) {
        this.logger.warn(`Driver ${driverId} not found`);
        return;
      }

      this.websocketsGateway.notifyUser(riderId, 'ride:accepted', {
        rideId,
        driverId,
        driverName: driver.user.name,
        driverPhone: driver.user.phone,
        driverRating: driver.rating,
        estimatedArrival: 5, // You can calculate this based on distance
        timestamp: new Date(),
      });

      this.logger.log(`Driver acceptance sent for ride ${rideId}`);
    } catch (error) {
      this.logger.error('Error sending driver acceptance:', error);
    }
  }

  /**
   * Send chat message
   */
  async sendChatMessage(rideId: string, senderId: string, recipientId: string, message: string) {
    try {
      this.websocketsGateway.notifyUser(recipientId, 'chat:message:new', {
        rideId,
        senderId,
        message,
        timestamp: new Date(),
      });

      this.logger.log(`Chat message sent in ride ${rideId}`);
    } catch (error) {
      this.logger.error('Error sending chat message:', error);
    }
  }

  /**
   * Send emergency alert
   */
  async sendEmergencyAlert(rideId: string, userId: string, type: string, message: string, location: any) {
    try {
      // Notify admin
      this.websocketsGateway.notifyUser('admin', 'emergency:alert:new', {
        rideId,
        userId,
        type,
        message,
        location,
        timestamp: new Date(),
      });

      // Also notify emergency contacts if available
      this.websocketsGateway.notifyRiders('emergency:alert:new', {
        rideId,
        userId,
        type,
        message,
        location,
        timestamp: new Date(),
      });

      this.logger.warn(`Emergency alert sent for ride ${rideId}`);
    } catch (error) {
      this.logger.error('Error sending emergency alert:', error);
    }
  }

  /**
   * Get nearby drivers for a location
   */
  async getNearbyDrivers(lat: number, lng: number, radius: number = 5000) {
    try {
      const connectedDrivers = this.websocketsGateway.getConnectedDrivers();
      const nearbyDrivers = [];

      for (const driverId of connectedDrivers) {
        const location = this.websocketsGateway.getDriverLocation(driverId);
        if (location) {
          const distance = this.calculateDistance(lat, lng, location.lat, location.lng);
          if (distance <= radius) {
            nearbyDrivers.push({
              driverId,
              lat: location.lat,
              lng: location.lng,
              distance,
              timestamp: location.timestamp,
            });
          }
        }
      }

      return nearbyDrivers.sort((a, b) => a.distance - b.distance);
    } catch (error) {
      this.logger.error('Error getting nearby drivers:', error);
      return [];
    }
  }

  /**
   * Send system-wide announcement
   */
  async sendAnnouncement(title: string, message: string, targetUsers?: string[]) {
    try {
      const announcement = {
        title,
        message,
        type: 'info',
        timestamp: new Date(),
      };

      if (targetUsers) {
        for (const userId of targetUsers) {
          this.websocketsGateway.notifyUser(userId, 'announcement:new', announcement);
        }
      } else {
        this.websocketsGateway.server.emit('announcement:new', announcement);
      }

      this.logger.log('Announcement sent');
    } catch (error) {
      this.logger.error('Error sending announcement:', error);
    }
  }

  /**
   * Get connected users count
   */
  getConnectedUsersCount(): { total: number; drivers: number; riders: number } {
    const connectedDrivers = this.websocketsGateway.getConnectedDrivers().length;
    const totalUsers = this.websocketsGateway['connectedUsers'].size;
    const riders = totalUsers - connectedDrivers;

    return {
      total: totalUsers,
      drivers: connectedDrivers,
      riders,
    };
  }

  /**
   * Helper method to calculate distance
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }
}
