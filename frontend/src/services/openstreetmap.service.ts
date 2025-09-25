import axios from 'axios';

interface Location {
  latitude: number;
  longitude: number;
  address: string;
}

interface Route {
  polyline: string;
  distance: number;
  duration: number;
}

interface Driver {
  latitude: number;
  longitude: number;
  distance: number;
}

class OpenStreetMapService {
  private baseUrl = 'https://nominatim.openstreetmap.org';
  private routingUrl = 'https://routing.openstreetmap.org/routed-car/route/v1/driving';

  // Geocode an address to coordinates
  async geocodeAddress(address: string): Promise<Location> {
    try {
      const response = await axios.get(`${this.baseUrl}/search`, {
        params: {
          q: address,
          format: 'json',
          limit: 1,
          countrycodes: 'ke', // Kenya
        },
      });

      if (response.data && response.data.length > 0) {
        const result = response.data[0];
        return {
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon),
          address: result.display_name,
        };
      }

      throw new Error('Address not found');
    } catch (error) {
      console.error('Geocoding error:', error);
      throw new Error('Failed to geocode address');
    }
  }

  // Reverse geocode coordinates to address
  async reverseGeocode(latitude: number, longitude: number): Promise<Location> {
    try {
      const response = await axios.get(`${this.baseUrl}/reverse`, {
        params: {
          lat: latitude,
          lon: longitude,
          format: 'json',
        },
      });

      if (response.data && response.data.display_name) {
        return {
          latitude,
          longitude,
          address: response.data.display_name,
        };
      }

      throw new Error('Address not found');
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      throw new Error('Failed to reverse geocode coordinates');
    }
  }

  // Search for places
  async searchPlaces(query: string, latitude?: number, longitude?: number): Promise<Location[]> {
    try {
      const params: any = {
        q: query,
        format: 'json',
        limit: 10,
        countrycodes: 'ke',
      };

      if (latitude && longitude) {
        params.lat = latitude;
        params.lon = longitude;
      }

      const response = await axios.get(`${this.baseUrl}/search`, { params });

      return response.data.map((place: any) => ({
        latitude: parseFloat(place.lat),
        longitude: parseFloat(place.lon),
        address: place.display_name,
        name: place.name || place.display_name.split(',')[0],
      }));
    } catch (error) {
      console.error('Search places error:', error);
      return [];
    }
  }

  // Get route between two points
  async getRoute(origin: Location, destination: Location): Promise<Route> {
    try {
      const response = await axios.get(this.routingUrl, {
        params: {
          start: `${origin.longitude},${origin.latitude}`,
          end: `${destination.longitude},${destination.latitude}`,
          overview: 'full',
          geometries: 'polyline',
        },
      });

      if (response.data.routes && response.data.routes.length > 0) {
        const route = response.data.routes[0];
        return {
          polyline: route.geometry,
          distance: Math.round(route.distance), // in meters
          duration: Math.round(route.duration), // in seconds
        };
      }

      throw new Error('No route found');
    } catch (error) {
      console.error('Route calculation error:', error);
      // Return a mock route for development
      return {
        polyline: this.generateMockPolyline(origin, destination),
        distance: this.calculateDistance(origin, destination),
        duration: Math.round(this.calculateDistance(origin, destination) / 10), // Assume 10 m/s average speed
      };
    }
  }

  // Find nearby drivers (mock implementation)
  async findNearbyDrivers(location: Location): Promise<Driver[]> {
    try {
      // In a real implementation, this would call your backend API
      // For now, return mock drivers
      return this.generateMockDrivers(location);
    } catch (error) {
      console.error('Find drivers error:', error);
      return [];
    }
  }

  // Calculate distance between two points (Haversine formula)
  private calculateDistance(origin: Location, destination: Location): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (origin.latitude * Math.PI) / 180;
    const φ2 = (destination.latitude * Math.PI) / 180;
    const Δφ = ((destination.latitude - origin.latitude) * Math.PI) / 180;
    const Δλ = ((destination.longitude - origin.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  // Generate mock polyline for development
  private generateMockPolyline(origin: Location, destination: Location): string {
    // This is a simplified polyline encoding
    // In production, you'd use a proper polyline encoding library
    const points = [
      { lat: origin.latitude, lng: origin.longitude },
      { lat: destination.latitude, lng: destination.longitude },
    ];
    
    // Simple polyline encoding (not production-ready)
    let encoded = '';
    let prevLat = 0;
    let prevLng = 0;

    for (const point of points) {
      const lat = Math.round(point.lat * 1e5);
      const lng = Math.round(point.lng * 1e5);
      
      const dLat = lat - prevLat;
      const dLng = lng - prevLng;
      
      encoded += this.encodeValue(dLat) + this.encodeValue(dLng);
      
      prevLat = lat;
      prevLng = lng;
    }

    return encoded;
  }

  // Encode a value for polyline
  private encodeValue(value: number): string {
    value = value < 0 ? ~(value << 1) : value << 1;
    let encoded = '';
    while (value >= 0x20) {
      encoded += String.fromCharCode(((value & 0x1f) | 0x20) + 63);
      value >>= 5;
    }
    encoded += String.fromCharCode(value + 63);
    return encoded;
  }

  // Generate mock drivers for development
  private generateMockDrivers(location: Location): Driver[] {
    const drivers: Driver[] = [];
    const numDrivers = Math.floor(Math.random() * 5) + 2; // 2-6 drivers

    for (let i = 0; i < numDrivers; i++) {
      // Generate random coordinates within ~2km radius
      const latOffset = (Math.random() - 0.5) * 0.02; // ~1km
      const lngOffset = (Math.random() - 0.5) * 0.02; // ~1km
      
      const driverLat = location.latitude + latOffset;
      const driverLng = location.longitude + lngOffset;
      
      const distance = this.calculateDistance(location, {
        latitude: driverLat,
        longitude: driverLng,
        address: '',
      });

      drivers.push({
        latitude: driverLat,
        longitude: driverLng,
        distance: Math.round(distance),
      });
    }

    return drivers.sort((a, b) => a.distance - b.distance);
  }
}

export default new OpenStreetMapService();