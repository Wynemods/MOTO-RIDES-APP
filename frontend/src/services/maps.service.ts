import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000'; // Change this to your backend URL

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

class MapsService {
  private token: string | null = null;

  setAuthToken(token: string) {
    this.token = token;
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
    };
  }

  /**
   * Geocode an address to get coordinates
   */
  async geocodeAddress(address: string): Promise<Location> {
    try {
      const response = await axios.get(`${API_BASE_URL}/maps/geocode`, {
        params: { address },
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Geocoding error:', error);
      throw error;
    }
  }

  /**
   * Reverse geocode coordinates to get address
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<Location> {
    try {
      const response = await axios.get(`${API_BASE_URL}/maps/reverse-geocode`, {
        params: { lat: latitude, lng: longitude },
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      throw error;
    }
  }

  /**
   * Search for places using text query
   */
  async searchPlaces(
    query: string,
    location?: { latitude: number; longitude: number }
  ): Promise<PlaceDetails[]> {
    try {
      const params: any = { query };
      if (location) {
        params.lat = location.latitude;
        params.lng = location.longitude;
      }

      const response = await axios.get(`${API_BASE_URL}/maps/search-places`, {
        params,
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Places search error:', error);
      throw error;
    }
  }

  /**
   * Get place details by place ID
   */
  async getPlaceDetails(placeId: string): Promise<PlaceDetails> {
    try {
      const response = await axios.get(`${API_BASE_URL}/maps/place-details`, {
        params: { placeId },
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Place details error:', error);
      throw error;
    }
  }

  /**
   * Calculate route between two points
   */
  async getRoute(
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number },
    mode: 'driving' | 'walking' | 'bicycling' = 'driving'
  ): Promise<RouteInfo> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/maps/route`,
        {
          origin: { lat: origin.latitude, lng: origin.longitude },
          destination: { lat: destination.latitude, lng: destination.longitude },
          mode,
        },
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Route calculation error:', error);
      throw error;
    }
  }

  /**
   * Find nearby drivers
   */
  async findNearbyDrivers(
    location: { latitude: number; longitude: number },
    radius?: number
  ): Promise<Array<{ lat: number; lng: number; distance: number }>> {
    try {
      const response = await axios.get(`${API_BASE_URL}/maps/nearby-drivers`, {
        params: {
          lat: location.latitude,
          lng: location.longitude,
          ...(radius && { radius }),
        },
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Nearby drivers error:', error);
      throw error;
    }
  }

  /**
   * Get current location using device GPS
   */
  async getCurrentLocation(): Promise<Location> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const location = await this.reverseGeocode(latitude, longitude);
            resolve(location);
          } catch (error) {
            reject(error);
          }
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    });
  }
}

export default new MapsService();
