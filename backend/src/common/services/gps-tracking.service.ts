import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface GPSLocation {
  lat: number;
  lng: number;
  timestamp: Date;
  accuracy?: number; // in meters
  speed?: number; // in km/h
}

export interface GPSTrack {
  rideId: string;
  locations: GPSLocation[];
  totalDistance: number; // in kilometers
  totalTime: number; // in minutes
  averageSpeed: number; // in km/h
  maxSpeed: number; // in km/h
  routePolyline?: string; // Encoded polyline of actual route
}

@Injectable()
export class GPSTrackingService {
  constructor(private prisma: PrismaService) {}

  /**
   * Start GPS tracking for a ride
   */
  async startTracking(rideId: string, initialLocation: GPSLocation): Promise<void> {
    await this.prisma.gpsTrack.create({
      data: {
        rideId,
        latitude: initialLocation.lat,
        longitude: initialLocation.lng,
        timestamp: initialLocation.timestamp,
        accuracy: initialLocation.accuracy,
        speed: initialLocation.speed,
      },
    });
  }

  /**
   * Add GPS location to existing track
   */
  async addLocation(rideId: string, location: GPSLocation): Promise<void> {
    await this.prisma.gpsTrack.create({
      data: {
        rideId,
        latitude: location.lat,
        longitude: location.lng,
        timestamp: location.timestamp,
        accuracy: location.accuracy,
        speed: location.speed,
      },
    });
  }

  /**
   * Get complete GPS track for a ride
   */
  async getTrack(rideId: string): Promise<GPSTrack> {
    const locations = await this.prisma.gpsTrack.findMany({
      where: { rideId },
      orderBy: { timestamp: 'asc' },
    });

    if (locations.length === 0) {
      throw new Error('No GPS data found for this ride');
    }

    const gpsLocations: GPSLocation[] = locations.map(loc => ({
      lat: Number(loc.latitude),
      lng: Number(loc.longitude),
      timestamp: loc.timestamp,
      accuracy: loc.accuracy ? Number(loc.accuracy) : undefined,
      speed: loc.speed ? Number(loc.speed) : undefined,
    }));

    const track = this.calculateTrackMetrics(gpsLocations);
    
    return {
      rideId,
      locations: gpsLocations,
      ...track,
    };
  }

  /**
   * Calculate actual distance traveled from GPS track
   */
  async calculateActualDistance(rideId: string): Promise<{
    distance: number;
    time: number;
    averageSpeed: number;
    maxSpeed: number;
  }> {
    const track = await this.getTrack(rideId);
    
    return {
      distance: track.totalDistance,
      time: track.totalTime,
      averageSpeed: track.averageSpeed,
      maxSpeed: track.maxSpeed,
    };
  }

  /**
   * Check if driver deviated significantly from planned route
   */
  async checkRouteDeviation(
    rideId: string,
    plannedRoute: { lat: number; lng: number }[],
    deviationThreshold: number = 0.5 // 500 meters
  ): Promise<{
    hasDeviated: boolean;
    deviationDistance: number;
    deviationPercentage: number;
  }> {
    const track = await this.getTrack(rideId);
    
    let totalDeviation = 0;
    let deviationCount = 0;
    
    for (const location of track.locations) {
      const nearestPoint = this.findNearestPointOnRoute(location, plannedRoute);
      const deviation = this.calculateDistance(location, nearestPoint);
      
      if (deviation > deviationThreshold) {
        totalDeviation += deviation;
        deviationCount++;
      }
    }
    
    const averageDeviation = deviationCount > 0 ? totalDeviation / deviationCount : 0;
    const deviationPercentage = (deviationCount / track.locations.length) * 100;
    
    return {
      hasDeviated: deviationCount > track.locations.length * 0.1, // 10% of points deviated
      deviationDistance: averageDeviation,
      deviationPercentage,
    };
  }

  /**
   * Generate route polyline from GPS track
   */
  generateRoutePolyline(locations: GPSLocation[]): string {
    // This would use a polyline encoding library
    // For now, return a simple representation
    const points = locations.map(loc => `${loc.lat},${loc.lng}`).join('|');
    return `polyline:${points}`;
  }

  /**
   * Calculate track metrics from GPS locations
   */
  private calculateTrackMetrics(locations: GPSLocation[]): {
    totalDistance: number;
    totalTime: number;
    averageSpeed: number;
    maxSpeed: number;
  } {
    if (locations.length < 2) {
      return {
        totalDistance: 0,
        totalTime: 0,
        averageSpeed: 0,
        maxSpeed: 0,
      };
    }

    let totalDistance = 0;
    let totalTime = 0;
    let maxSpeed = 0;
    let speedSum = 0;
    let speedCount = 0;

    for (let i = 1; i < locations.length; i++) {
      const prev = locations[i - 1];
      const curr = locations[i];
      
      const distance = this.calculateDistance(prev, curr);
      const timeDiff = (curr.timestamp.getTime() - prev.timestamp.getTime()) / 1000 / 60; // minutes
      
      totalDistance += distance;
      totalTime += timeDiff;
      
      if (curr.speed) {
        speedSum += curr.speed;
        speedCount++;
        maxSpeed = Math.max(maxSpeed, curr.speed);
      } else if (timeDiff > 0) {
        const speed = (distance / timeDiff) * 60; // km/h
        speedSum += speed;
        speedCount++;
        maxSpeed = Math.max(maxSpeed, speed);
      }
    }

    return {
      totalDistance,
      totalTime,
      averageSpeed: speedCount > 0 ? speedSum / speedCount : 0,
      maxSpeed,
    };
  }

  /**
   * Find nearest point on planned route
   */
  private findNearestPointOnRoute(
    location: GPSLocation,
    plannedRoute: { lat: number; lng: number }[]
  ): { lat: number; lng: number } {
    let nearestPoint = plannedRoute[0];
    let minDistance = this.calculateDistance(location, nearestPoint);

    for (const point of plannedRoute) {
      const distance = this.calculateDistance(location, point);
      if (distance < minDistance) {
        minDistance = distance;
        nearestPoint = point;
      }
    }

    return nearestPoint;
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  private calculateDistance(point1: GPSLocation, point2: { lat: number; lng: number }): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(point2.lat - point1.lat);
    const dLng = this.toRadians(point2.lng - point1.lng);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(point1.lat)) * Math.cos(this.toRadians(point2.lat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Stop GPS tracking and finalize track
   */
  async stopTracking(rideId: string): Promise<GPSTrack> {
    return this.getTrack(rideId);
  }

  /**
   * Clean up old GPS data (for maintenance)
   */
  async cleanupOldTracks(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.prisma.gpsTrack.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  }
}
