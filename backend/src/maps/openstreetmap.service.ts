import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';

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
export class OpenStreetMapService {
  private readonly nominatimBaseUrl = 'https://nominatim.openstreetmap.org';

  /**
   * Geocode an address to get coordinates using OpenStreetMap
   */
  async geocodeAddress(address: string): Promise<Location> {
    try {
      const response = await axios.get(`${this.nominatimBaseUrl}/search`, {
        params: {
          q: address,
          format: 'json',
          limit: 1,
          addressdetails: 1,
        },
        headers: {
          'User-Agent': 'MotoLink/1.0', // Required by Nominatim
        },
      });

      if (!response.data || response.data.length === 0) {
        throw new HttpException('Address not found', HttpStatus.NOT_FOUND);
      }

      const result = response.data[0];
      return {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        address: result.display_name,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Geocoding failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Reverse geocode coordinates to get address
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<Location> {
    try {
      const response = await axios.get(`${this.nominatimBaseUrl}/reverse`, {
        params: {
          lat: latitude,
          lon: longitude,
          format: 'json',
          addressdetails: 1,
        },
        headers: {
          'User-Agent': 'MotoLink/1.0',
        },
      });

      if (!response.data) {
        throw new HttpException('Location not found', HttpStatus.NOT_FOUND);
      }

      return {
        latitude,
        longitude,
        address: response.data.display_name,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Reverse geocoding failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Search for places using text query
   */
  async searchPlaces(query: string, location?: { lat: number; lng: number }): Promise<PlaceDetails[]> {
    try {
      const params: any = {
        q: query,
        format: 'json',
        limit: 10,
        addressdetails: 1,
      };

      if (location) {
        params.lat = location.lat;
        params.lon = location.lng;
        params.radius = 50000; // 50km radius
      }

      const response = await axios.get(`${this.nominatimBaseUrl}/search`, {
        params,
        headers: {
          'User-Agent': 'MotoLink/1.0',
        },
      });

      return response.data.map((place: any) => ({
        placeId: place.place_id.toString(),
        name: place.name || place.display_name.split(',')[0],
        address: place.display_name,
        latitude: parseFloat(place.lat),
        longitude: parseFloat(place.lon),
        types: place.type ? [place.type] : [],
      }));
    } catch (error) {
      throw new HttpException('Places search failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Calculate estimated travel time
   */
  calculateTravelTime(distance: number, mode: 'driving' | 'walking' | 'bicycling' = 'driving'): number {
    let speed = 50; // km/h default
    
    switch (mode) {
      case 'driving':
        speed = 50; // 50 km/h average in city
        break;
      case 'walking':
        speed = 5; // 5 km/h walking
        break;
      case 'bicycling':
        speed = 15; // 15 km/h cycling
        break;
    }

    return (distance / 1000) / speed * 3600; // Convert to seconds
  }

  /**
   * Get route between two points
   */
  async getRoute(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    mode: 'driving' | 'walking' | 'bicycling' = 'driving'
  ): Promise<RouteInfo> {
    try {
      const distance = this.calculateDistance(
        origin.lat,
        origin.lng,
        destination.lat,
        destination.lng
      );

      const duration = this.calculateTravelTime(distance, mode);

      // Create a simple polyline (straight line for now)
      const polyline = this.createSimplePolyline(origin, destination);

      return {
        distance,
        duration,
        polyline,
      };
    } catch (error) {
      throw new HttpException('Route calculation failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Create a simple polyline between two points
   */
  private createSimplePolyline(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ): string {
    const points = [
      { lat: origin.lat, lng: origin.lng },
      { lat: destination.lat, lng: destination.lng },
    ];
    
    return this.encodePolyline(points);
  }

  /**
   * Simple polyline encoding
   */
  private encodePolyline(points: Array<{ lat: number; lng: number }>): string {
    let encoded = '';
    let lat = 0;
    let lng = 0;

    for (const point of points) {
      const dLat = Math.round((point.lat - lat) * 1e5);
      const dLng = Math.round((point.lng - lng) * 1e5);
      lat = point.lat;
      lng = point.lng;
      encoded += this.encodeSignedNumber(dLat) + this.encodeSignedNumber(dLng);
    }

    return encoded;
  }

  private encodeSignedNumber(num: number): string {
    const sgn_num = num << 1;
    const result = sgn_num < 0 ? ~(sgn_num) : sgn_num;
    return result.toString();
  }

  /**
   * Find nearby drivers (mock implementation)
   */
  async findNearbyDrivers(
    location: { lat: number; lng: number },
    radius: number = 5000
  ): Promise<Array<{ lat: number; lng: number; distance: number }>> {
    // Mock nearby drivers - in production, query your database
    const mockDrivers = [
      {
        lat: location.lat + 0.001,
        lng: location.lng + 0.001,
        distance: this.calculateDistance(
          location.lat,
          location.lng,
          location.lat + 0.001,
          location.lng + 0.001
        ),
      },
      {
        lat: location.lat - 0.002,
        lng: location.lng + 0.001,
        distance: this.calculateDistance(
          location.lat,
          location.lng,
          location.lat - 0.002,
          location.lng + 0.001
        ),
      },
      {
        lat: location.lat + 0.001,
        lng: location.lng - 0.002,
        distance: this.calculateDistance(
          location.lat,
          location.lng,
          location.lat + 0.001,
          location.lng - 0.002
        ),
      },
    ];

    return mockDrivers.filter(driver => driver.distance <= radius);
  }
}
