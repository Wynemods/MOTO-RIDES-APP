import { Injectable } from '@nestjs/common';
import { DistanceCalculationService } from './distance-calculation.service';

export interface Location {
  lat: number;
  lng: number;
}

export interface FareCalculationRequest {
  pickup: Location;
  destination: Location;
  rideType?: 'bike' | 'car' | 'premium';
}

export interface FareCalculationResult {
  distance: number; // in kilometers
  baseFare: number; // in KSH
  rideTypeMultiplier: number;
  finalFare: number; // in KSH
  currency: string;
  estimatedTime: number; // in minutes
  route: string; // route description
  calculationMethod: 'google' | 'openroute' | 'haversine';
  breakdown: {
    distanceKm: number;
    ratePerKm: number;
    baseAmount: number;
    rideTypeMultiplier: number;
    total: number;
  };
  // Commission fields
  driverEarnings: number; // Amount driver receives after commission
  appCommission: number; // Commission amount
  commissionPerKm: number; // Commission rate per km
  // Route information
  routePolyline?: string; // Encoded polyline for map display
  routeSteps?: RouteStep[]; // Detailed route steps
  warnings?: string[]; // Any warnings about the route
}

export interface RouteStep {
  distance: number; // in meters
  duration: number; // in seconds
  instruction: string;
  coordinates: { lat: number; lng: number }[];
}

@Injectable()
export class FareCalculationService {
  private readonly RATE_PER_KM = 60; // KSH per kilometer
  private readonly COMMISSION_PER_KM = 17; // KSH commission per kilometer
  private readonly CURRENCY = 'KSH';

  constructor(private distanceCalculationService: DistanceCalculationService) {}
  
  // Ride type multipliers
  private readonly RIDE_TYPE_MULTIPLIERS = {
    bike: 1.0,      // Standard rate
    car: 1.5,       // 50% more expensive
    premium: 2.0,   // 100% more expensive
  };

  /**
   * Calculate fare based on distance and ride type
   * Now uses actual road distance from Google Maps
   */
  async calculateFare(request: FareCalculationRequest): Promise<FareCalculationResult> {
    // Get detailed route information including distance, time, and route data
    const routeInfo = await this.distanceCalculationService.getDetailedDistance(
      request.pickup, 
      request.destination
    );
    
    const rideType = request.rideType || 'bike';
    const multiplier = this.RIDE_TYPE_MULTIPLIERS[rideType];
    
    const baseFare = routeInfo.distance * this.RATE_PER_KM;
    const finalFare = Math.round(baseFare * multiplier);
    
    // Calculate commission and driver earnings
    const appCommission = routeInfo.distance * this.COMMISSION_PER_KM;
    const driverEarnings = finalFare - appCommission;

    // Generate warnings if needed
    const warnings = this.generateRouteWarnings(routeInfo);

    return {
      distance: routeInfo.distance,
      baseFare,
      rideTypeMultiplier: multiplier,
      finalFare,
      currency: this.CURRENCY,
      estimatedTime: routeInfo.duration,
      route: routeInfo.route,
      calculationMethod: routeInfo.method,
      driverEarnings: Math.round(driverEarnings),
      appCommission: Math.round(appCommission),
      commissionPerKm: this.COMMISSION_PER_KM,
      breakdown: {
        distanceKm: Math.round(routeInfo.distance * 100) / 100,
        ratePerKm: this.RATE_PER_KM,
        baseAmount: Math.round(baseFare * 100) / 100,
        rideTypeMultiplier: multiplier,
        total: finalFare,
      },
      warnings,
    };
  }


  /**
   * Generate route warnings based on distance and calculation method
   */
  private generateRouteWarnings(routeInfo: any): string[] {
    const warnings: string[] = [];
    
    // Warning if using fallback calculation
    if (routeInfo.method === 'haversine') {
      warnings.push('Using estimated distance - actual fare may vary');
    }
    
    // Warning for very long distances
    if (routeInfo.distance > 50) {
      warnings.push('Long distance ride - consider alternative transport');
    }
    
    // Warning for very short distances
    if (routeInfo.distance < 1) {
      warnings.push('Very short distance - walking might be faster');
    }
    
    // Warning for high traffic areas (if we can detect)
    if (routeInfo.duration > routeInfo.distance * 3) {
      warnings.push('Heavy traffic expected - journey may take longer');
    }
    
    return warnings;
  }

  /**
   * Recalculate fare based on actual traveled distance
   */
  async recalculateFare(
    originalFare: FareCalculationResult,
    actualDistance: number,
    actualTime: number
  ): Promise<FareCalculationResult> {
    const rideType = originalFare.rideTypeMultiplier === 1.0 ? 'bike' : 
                    originalFare.rideTypeMultiplier === 1.5 ? 'car' : 'premium';
    
    const baseFare = actualDistance * this.RATE_PER_KM;
    const finalFare = Math.round(baseFare * originalFare.rideTypeMultiplier);
    
    const appCommission = actualDistance * this.COMMISSION_PER_KM;
    const driverEarnings = finalFare - appCommission;
    
    const warnings = this.generateRouteWarnings({
      distance: actualDistance,
      duration: actualTime,
      method: 'actual'
    });
    
    return {
      ...originalFare,
      distance: actualDistance,
      baseFare,
      finalFare,
      estimatedTime: actualTime,
      driverEarnings: Math.round(driverEarnings),
      appCommission: Math.round(appCommission),
      breakdown: {
        ...originalFare.breakdown,
        distanceKm: Math.round(actualDistance * 100) / 100,
        baseAmount: Math.round(baseFare * 100) / 100,
        total: finalFare,
      },
      warnings: [...(originalFare.warnings || []), ...warnings],
    };
  }

  /**
   * Validate if a route can be calculated
   */
  async validateRoute(pickup: Location, destination: Location): Promise<{
    isValid: boolean;
    reason?: string;
    alternativeRoutes?: Location[];
  }> {
    try {
      const routeInfo = await this.distanceCalculationService.getDetailedDistance(pickup, destination);
      
      // Check if distance is reasonable (not too short or too long)
      if (routeInfo.distance < 0.1) {
        return {
          isValid: false,
          reason: 'Distance too short - consider walking',
          alternativeRoutes: []
        };
      }
      
      if (routeInfo.distance > 100) {
        return {
          isValid: false,
          reason: 'Distance too long - consider alternative transport',
          alternativeRoutes: []
        };
      }
      
      // Check if route is accessible
      if (routeInfo.method === 'haversine') {
        return {
          isValid: false,
          reason: 'Unable to calculate road route - please check locations',
          alternativeRoutes: []
        };
      }
      
      return {
        isValid: true,
        alternativeRoutes: []
      };
    } catch (error) {
      return {
        isValid: false,
        reason: 'Unable to calculate route - please check your internet connection',
        alternativeRoutes: []
      };
    }
  }

  /**
   * Get available ride types with their multipliers
   */
  getRideTypes() {
    return Object.entries(this.RIDE_TYPE_MULTIPLIERS).map(([type, multiplier]) => ({
      type,
      multiplier,
      displayName: this.getRideTypeDisplayName(type),
      description: this.getRideTypeDescription(type),
    }));
  }

  private getRideTypeDisplayName(type: string): string {
    const names = {
      bike: 'Motorcycle',
      car: 'Car',
      premium: 'Premium',
    };
    return names[type] || type;
  }

  private getRideTypeDescription(type: string): string {
    const descriptions = {
      bike: 'Fast and affordable motorcycle ride',
      car: 'Comfortable car ride',
      premium: 'Luxury vehicle with premium service',
    };
    return descriptions[type] || '';
  }
}
