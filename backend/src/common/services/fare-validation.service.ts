import { Injectable } from '@nestjs/common';
import { FareCalculationService } from './fare-calculation.service';

export interface FareValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fare: {
    distance: number;
    baseFare: number;
    finalFare: number;
    currency: string;
    breakdown: any;
  };
}

@Injectable()
export class FareValidationService {
  private readonly MIN_DISTANCE = 0.1; // 100 meters minimum
  private readonly MAX_DISTANCE = 100; // 100 km maximum
  private readonly MIN_FARE = 50; // 50 KSH minimum
  private readonly MAX_FARE = 5000; // 5000 KSH maximum

  constructor(private fareCalculationService: FareCalculationService) {}

  /**
   * Validate fare calculation and ensure it meets business rules
   */
  async validateFare(
    pickup: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    rideType: string = 'bike'
  ): Promise<FareValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Calculate fare
    const fare = await this.fareCalculationService.calculateFare({
      pickup,
      destination,
      rideType: rideType as any,
    });

    // Validate distance
    if (fare.distance < this.MIN_DISTANCE) {
      errors.push('Distance too short. Minimum distance is 100 meters.');
    }

    if (fare.distance > this.MAX_DISTANCE) {
      errors.push('Distance too long. Maximum distance is 100 km.');
    }

    // Validate fare amount
    if (fare.finalFare < this.MIN_FARE) {
      errors.push(`Fare too low. Minimum fare is ${this.MIN_FARE} KSH.`);
    }

    if (fare.finalFare > this.MAX_FARE) {
      errors.push(`Fare too high. Maximum fare is ${this.MAX_FARE} KSH.`);
    }

    // Check for suspiciously high fares
    if (fare.finalFare > fare.baseFare * 3) {
      warnings.push('Fare seems unusually high. Please verify the destination.');
    }

    // Check for very short distances with high fares
    if (fare.distance < 1 && fare.finalFare > 200) {
      warnings.push('High fare for short distance. Please check the route.');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      fare: {
        distance: fare.distance,
        baseFare: fare.baseFare,
        finalFare: fare.finalFare,
        currency: fare.currency,
        breakdown: fare.breakdown,
      },
    };
  }

  /**
   * Get fare estimate with validation
   */
  async getFareEstimate(
    pickup: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    rideType: string = 'bike'
  ) {
    const validation = await this.validateFare(pickup, destination, rideType);
    
    return {
      ...validation.fare,
      validation: {
        isValid: validation.isValid,
        errors: validation.errors,
        warnings: validation.warnings,
      },
      // Add transparency information
      transparency: {
        ratePerKm: 60,
        currency: 'KSH',
        calculationMethod: 'Distance × Rate × Ride Type Multiplier',
        example: `${validation.fare.distance.toFixed(1)} km × 60 KSH/km × ${this.getRideTypeMultiplier(rideType)} = ${validation.fare.finalFare} KSH`,
      },
    };
  }

  /**
   * Get ride type multiplier
   */
  private getRideTypeMultiplier(rideType: string): number {
    const multipliers = {
      bike: 1.0,
      car: 1.5,
      premium: 2.0,
    };
    return multipliers[rideType] || 1.0;
  }

  /**
   * Validate fare before ride confirmation
   */
  async validateFareForConfirmation(
    pickup: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    rideType: string,
    expectedFare: number
  ): Promise<{ isValid: boolean; message: string; actualFare: number }> {
    const validation = await this.validateFare(pickup, destination, rideType);
    
    if (!validation.isValid) {
      return {
        isValid: false,
        message: validation.errors.join(', '),
        actualFare: validation.fare.finalFare,
      };
    }

    // Check if fare matches expected amount
    const fareDifference = Math.abs(validation.fare.finalFare - expectedFare);
    if (fareDifference > 10) { // Allow 10 KSH difference
      return {
        isValid: false,
        message: `Fare has changed. Expected ${expectedFare} KSH, calculated ${validation.fare.finalFare} KSH.`,
        actualFare: validation.fare.finalFare,
      };
    }

    return {
      isValid: true,
      message: 'Fare is valid and confirmed.',
      actualFare: validation.fare.finalFare,
    };
  }
}
