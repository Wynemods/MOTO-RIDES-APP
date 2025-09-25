import { Injectable } from '@nestjs/common';

export interface Location {
  lat: number;
  lng: number;
}

@Injectable()
export class DistanceCalculationService {
  /**
   * Calculate road distance using multiple services with fallbacks
   */
  async calculateRoadDistance(origin: Location, destination: Location): Promise<number> {
    // Try Google Maps first (most accurate)
    try {
      return await this.getGoogleMapsDistance(origin, destination);
    } catch (error) {
      console.log('Google Maps failed, trying OpenRouteService...');
    }

    // Try OpenRouteService (free alternative)
    try {
      return await this.getOpenRouteServiceDistance(origin, destination);
    } catch (error) {
      console.log('OpenRouteService failed, using Haversine fallback...');
    }

    // Fallback to Haversine formula (straight-line distance)
    return this.calculateHaversineDistance(origin, destination);
  }

  /**
   * Google Maps Distance Matrix API
   */
  private async getGoogleMapsDistance(origin: Location, destination: Location): Promise<number> {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      throw new Error('Google Maps API key not configured');
    }

    const originStr = `${origin.lat},${origin.lng}`;
    const destinationStr = `${destination.lat},${destination.lng}`;
    
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originStr}&destinations=${destinationStr}&units=metric&key=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'OK' && data.rows[0] && data.rows[0].elements[0]) {
      const element = data.rows[0].elements[0];
      
      if (element.status === 'OK') {
        return element.distance.value / 1000; // Convert to kilometers
      } else {
        throw new Error(`Google Maps API error: ${element.status}`);
      }
    } else {
      throw new Error(`Google Maps API error: ${data.status}`);
    }
  }

  /**
   * OpenRouteService API (free alternative)
   */
  private async getOpenRouteServiceDistance(origin: Location, destination: Location): Promise<number> {
    const apiKey = process.env.OPENROUTE_API_KEY;
    
    if (!apiKey) {
      throw new Error('OpenRouteService API key not configured');
    }

    const url = 'https://api.openrouteservice.org/v2/directions/driving-car';
    
    const body = {
      coordinates: [
        [origin.lng, origin.lat], // OpenRouteService uses [lng, lat] format
        [destination.lng, destination.lat]
      ],
      units: 'km'
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    
    if (data.features && data.features[0] && data.features[0].properties && data.features[0].properties.summary) {
      return data.features[0].properties.summary.distance;
    } else {
      throw new Error('OpenRouteService API error');
    }
  }

  /**
   * Haversine formula (straight-line distance fallback)
   */
  private calculateHaversineDistance(point1: Location, point2: Location): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(point2.lat - point1.lat);
    const dLng = this.toRadians(point2.lng - point1.lng);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(point1.lat)) * Math.cos(this.toRadians(point2.lat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance;
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Get distance with additional route information
   */
  async getDetailedDistance(origin: Location, destination: Location): Promise<{
    distance: number;
    duration: number; // in minutes
    route: string; // route description
    method: 'google' | 'openroute' | 'haversine';
  }> {
    let distance: number;
    let duration = 0;
    let route = 'Direct route';
    let method: 'google' | 'openroute' | 'haversine' = 'haversine';

    // Try Google Maps first
    try {
      const result = await this.getGoogleMapsDetailedDistance(origin, destination);
      distance = result.distance;
      duration = result.duration;
      route = result.route;
      method = 'google';
    } catch (error) {
      // Try OpenRouteService
      try {
        const result = await this.getOpenRouteServiceDetailedDistance(origin, destination);
        distance = result.distance;
        duration = result.duration;
        route = result.route;
        method = 'openroute';
      } catch (error) {
        // Fallback to Haversine
        distance = this.calculateHaversineDistance(origin, destination);
        duration = Math.round(distance * 2); // Estimate 2 minutes per km
        route = 'Direct route (estimated)';
        method = 'haversine';
      }
    }

    return { distance, duration, route, method };
  }

  private async getGoogleMapsDetailedDistance(origin: Location, destination: Location): Promise<{
    distance: number;
    duration: number;
    route: string;
  }> {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      throw new Error('Google Maps API key not configured');
    }

    const originStr = `${origin.lat},${origin.lng}`;
    const destinationStr = `${destination.lat},${destination.lng}`;
    
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originStr}&destinations=${destinationStr}&units=metric&key=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'OK' && data.rows[0] && data.rows[0].elements[0]) {
      const element = data.rows[0].elements[0];
      
      if (element.status === 'OK') {
        return {
          distance: element.distance.value / 1000,
          duration: element.duration.value / 60, // Convert to minutes
          route: element.distance.text
        };
      } else {
        throw new Error(`Google Maps API error: ${element.status}`);
      }
    } else {
      throw new Error(`Google Maps API error: ${data.status}`);
    }
  }

  private async getOpenRouteServiceDetailedDistance(origin: Location, destination: Location): Promise<{
    distance: number;
    duration: number;
    route: string;
  }> {
    const apiKey = process.env.OPENROUTE_API_KEY;
    
    if (!apiKey) {
      throw new Error('OpenRouteService API key not configured');
    }

    const url = 'https://api.openrouteservice.org/v2/directions/driving-car';
    
    const body = {
      coordinates: [
        [origin.lng, origin.lat],
        [destination.lng, destination.lat]
      ],
      units: 'km'
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    
    if (data.features && data.features[0] && data.features[0].properties && data.features[0].properties.summary) {
      const summary = data.features[0].properties.summary;
      return {
        distance: summary.distance,
        duration: summary.duration / 60, // Convert to minutes
        route: `${summary.distance.toFixed(1)}km route`
      };
    } else {
      throw new Error('OpenRouteService API error');
    }
  }
}
