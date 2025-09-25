import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenStreetMapService } from './openstreetmap.service';

export interface Location {
  latitude: number;
  longitude: number;
  address: string;
}

export interface PlaceDetails {
  placeId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  types: string[];
}

export interface RouteInfo {
  distance: number; // in meters
  duration: number; // in seconds
  polyline: string;
}

@Injectable()
export class MapsService {
  constructor(
    private configService: ConfigService,
    private openStreetMapService: OpenStreetMapService
  ) {}

  /**
   * Geocode an address to get coordinates
   */
  async geocodeAddress(address: string): Promise<Location> {
    return this.openStreetMapService.geocodeAddress(address);
  }

  /**
   * Reverse geocode coordinates to get address
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<Location> {
    return this.openStreetMapService.reverseGeocode(latitude, longitude);
  }

  /**
   * Search for places using text query
   */
  async searchPlaces(query: string, location?: { lat: number; lng: number }): Promise<PlaceDetails[]> {
    return this.openStreetMapService.searchPlaces(query, location);
  }

  /**
   * Get place details by place ID
   */
  async getPlaceDetails(placeId: string): Promise<PlaceDetails> {
    // For OpenStreetMap, we'll search by place ID
    const places = await this.openStreetMapService.searchPlaces(placeId);
    if (places.length === 0) {
      throw new HttpException('Place details not found', HttpStatus.NOT_FOUND);
    }
    return places[0];
  }

  /**
   * Calculate route between two points
   */
  async getRoute(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    mode: 'driving' | 'walking' | 'bicycling' = 'driving'
  ): Promise<RouteInfo> {
    return this.openStreetMapService.getRoute(origin, destination, mode);
  }

  /**
   * Calculate distance matrix between multiple points
   */
  async getDistanceMatrix(
    origins: Array<{ lat: number; lng: number }>,
    destinations: Array<{ lat: number; lng: number }>
  ): Promise<Array<Array<{ distance: number; duration: number }>>> {
    const results = [];
    
    for (const origin of origins) {
      const row = [];
      for (const destination of destinations) {
        const distance = this.openStreetMapService.calculateDistance(
          origin.lat,
          origin.lng,
          destination.lat,
          destination.lng
        );
        const duration = this.openStreetMapService.calculateTravelTime(distance);
        row.push({ distance, duration });
      }
      results.push(row);
    }
    
    return results;
  }

  /**
   * Find nearby drivers
   */
  async findNearbyDrivers(
    location: { lat: number; lng: number },
    radius: number = 5000
  ): Promise<Array<{ lat: number; lng: number; distance: number }>> {
    return this.openStreetMapService.findNearbyDrivers(location, radius);
  }
}
