import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { WebsocketsService } from './websockets.service';

export interface TrackingData {
  rideId: string;
  driverId: string;
  riderId: string;
  currentLocation: {
    lat: number;
    lng: number;
    heading?: number;
    speed?: number;
  };
  route?: {
    polyline: string;
    waypoints: Array<{ lat: number; lng: number }>;
  };
  eta?: number;
  distanceRemaining?: number;
  timestamp: Date;
}

export interface DriverLocation {
  driverId: string;
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  status: 'online' | 'offline' | 'busy' | 'available';
  timestamp: Date;
}

@Injectable()
export class TrackingService {
  private readonly logger = new Logger(TrackingService.name);
  private readonly trackingInterval = 5000; // 5 seconds
  private activeTrackings = new Map<string, NodeJS.Timeout>();

  constructor(
    private prisma: PrismaService,
    private websocketsService: WebsocketsService,
  ) {}

  /**
   * Start tracking a ride
   */
  async startRideTracking(rideId: string): Promise<void> {
    try {
      const ride = await this.prisma.ride.findUnique({
        where: { id: rideId },
        include: { driver: true, rider: true },
      });

      if (!ride || !ride.driver) {
        this.logger.warn(`Cannot start tracking for ride ${rideId}: ride or driver not found`);
        return;
      }

      // Clear any existing tracking for this ride
      this.stopRideTracking(rideId);

      // Start tracking interval
      const interval = setInterval(async () => {
        await this.updateRideTracking(rideId);
      }, this.trackingInterval);

      this.activeTrackings.set(rideId, interval);
      this.logger.log(`Started tracking for ride ${rideId}`);
    } catch (error) {
      this.logger.error(`Error starting ride tracking for ${rideId}:`, error);
    }
  }

  /**
   * Stop tracking a ride
   */
  stopRideTracking(rideId: string): void {
    const interval = this.activeTrackings.get(rideId);
    if (interval) {
      clearInterval(interval);
      this.activeTrackings.delete(rideId);
      this.logger.log(`Stopped tracking for ride ${rideId}`);
    }
  }

  /**
   * Update ride tracking data
   */
  private async updateRideTracking(rideId: string): Promise<void> {
    try {
      const ride = await this.prisma.ride.findUnique({
        where: { id: rideId },
        include: { driver: true, rider: true },
      });

      if (!ride || !ride.driver) {
        this.stopRideTracking(rideId);
        return;
      }

      const driverId = ride.driver.id;
      const riderId = ride.rider.id;

      // Get driver's current location from WebSocket service
      const driverLocation = this.websocketsService['websocketsGateway'].getDriverLocation(driverId);
      
      if (!driverLocation) {
        this.logger.debug(`No location data for driver ${driverId} in ride ${rideId}`);
        return;
      }

      // Calculate ETA and distance remaining
      const eta = this.calculateETA(driverLocation, { lat: ride.destinationLat, lng: ride.destinationLng });
      const distanceRemaining = this.calculateDistance(
        driverLocation.lat,
        driverLocation.lng,
        ride.destinationLat,
        ride.destinationLng
      );

      // Update ride with current location
      await this.prisma.ride.update({
        where: { id: rideId },
        data: {
          currentLat: driverLocation.lat,
          currentLng: driverLocation.lng,
        },
      });

      // Send tracking update to rider
      const trackingData: TrackingData = {
        rideId,
        driverId: driverId,
        riderId: riderId,
        currentLocation: {
          lat: driverLocation.lat,
          lng: driverLocation.lng,
          heading: (driverLocation as any).heading,
          speed: (driverLocation as any).speed,
        },
        eta,
        distanceRemaining,
        timestamp: new Date(),
      };

      await this.websocketsService.sendRideUpdate({
        rideId,
        status: 'in_progress',
        driverId: driverId,
        riderId: riderId,
        location: {
          lat: driverLocation.lat,
          lng: driverLocation.lng,
        },
        eta,
        timestamp: new Date(),
      });

      this.logger.debug(`Updated tracking for ride ${rideId}`);
    } catch (error) {
      this.logger.error(`Error updating ride tracking for ${rideId}:`, error);
    }
  }

  /**
   * Get active rides for a driver
   */
  async getActiveRidesForDriver(driverId: string): Promise<any[]> {
    return this.prisma.ride.findMany({
      where: {
        driver: { id: driverId },
        status: 'started',
      },
      include: { rider: true },
    });
  }

  /**
   * Get ride tracking history
   */
  async getRideTrackingHistory(rideId: string): Promise<TrackingData[]> {
    // This would typically come from a separate tracking history table
    // For now, we'll return empty array
    return [];
  }

  /**
   * Update driver location
   */
  async updateDriverLocation(
    driverId: string,
    lat: number,
    lng: number,
    heading?: number,
    speed?: number
  ): Promise<void> {
    try {
      // Update driver location in WebSocket gateway
      this.websocketsService['websocketsGateway']['driverLocations'].set(driverId, {
        lat,
        lng,
        timestamp: new Date(),
      });

      // Send location update
      await this.websocketsService.sendLocationUpdate({
        userId: driverId,
        lat,
        lng,
        heading,
        speed,
        timestamp: new Date(),
      });

      this.logger.debug(`Updated location for driver ${driverId}`);
    } catch (error) {
      this.logger.error(`Error updating driver location for ${driverId}:`, error);
    }
  }

  /**
   * Get nearby drivers for a location
   */
  async getNearbyDrivers(
    lat: number,
    lng: number,
    radius: number = 5000
  ): Promise<DriverLocation[]> {
    try {
      const nearbyDrivers = await this.websocketsService.getNearbyDrivers(lat, lng, radius);
      
      return nearbyDrivers.map(driver => ({
        driverId: driver.driverId,
        lat: driver.lat,
        lng: driver.lng,
        status: 'available', // You can determine this from driver status
        timestamp: driver.timestamp,
      }));
    } catch (error) {
      this.logger.error('Error getting nearby drivers:', error);
      return [];
    }
  }

  /**
   * Calculate ETA between two points
   */
  private calculateETA(
    from: { lat: number; lng: number },
    to: { lat: number; lng: number }
  ): number {
    const distance = this.calculateDistance(from.lat, from.lng, to.lat, to.lng);
    const averageSpeed = 30; // km/h - you can make this dynamic
    const etaMinutes = (distance / 1000) / averageSpeed * 60;
    return Math.round(etaMinutes);
  }

  /**
   * Calculate distance between two points
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

  /**
   * Get all active trackings
   */
  getActiveTrackings(): string[] {
    return Array.from(this.activeTrackings.keys());
  }

  /**
   * Stop all trackings
   */
  stopAllTrackings(): void {
    for (const [rideId, interval] of this.activeTrackings) {
      clearInterval(interval);
    }
    this.activeTrackings.clear();
    this.logger.log('Stopped all ride trackings');
  }

  /**
   * Get tracking statistics
   */
  getTrackingStats(): {
    activeTrackings: number;
    trackedRides: string[];
  } {
    return {
      activeTrackings: this.activeTrackings.size,
      trackedRides: Array.from(this.activeTrackings.keys()),
    };
  }
}
