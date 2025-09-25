import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateRideDto, RideType } from './dto/create-ride.dto';
import { CreateRatingDto } from './dto/rating.dto';
import { PaymentsService } from '../payments/payments.service';
import { FareCalculationService } from '../common/services/fare-calculation.service';
import { EdgeCaseService } from '../common/services/edge-case.service';
import { CancellationFineService } from '../common/services/cancellation-fine.service';
import { CashPaymentService } from '../common/services/cash-payment.service';
import { SplitFareService } from '../common/services/split-fare.service';
import { GPSTrackingService } from '../common/services/gps-tracking.service';

@Injectable()
export class RidesService {
  constructor(
    private prisma: PrismaService,
    private paymentsService: PaymentsService,
    private fareCalculationService: FareCalculationService,
    private edgeCaseService: EdgeCaseService,
    private cancellationFineService: CancellationFineService,
    private cashPaymentService: CashPaymentService,
    private splitFareService: SplitFareService,
    private gpsTrackingService: GPSTrackingService,
  ) {}

  async createRide(riderId: string, createRideDto: CreateRideDto): Promise<any> {
    // Check if user can request rides (no active fine)
    const rideEligibility = await this.cancellationFineService.canRequestRide(riderId);
    if (!rideEligibility.canRequest) {
      throw new ForbiddenException(rideEligibility.reason);
    }

    // Check if user has any pending rides
    const existingRide = await this.prisma.ride.findFirst({
      where: {
        riderId,
        status: {
          in: ['pending', 'accepted', 'arrived', 'started']
        }
      }
    });

    if (existingRide) {
      throw new BadRequestException('You already have an active ride');
    }

    // Calculate fare using actual road distance from Google Maps
    const fareCalculation = await this.fareCalculationService.calculateFare({
      pickup: createRideDto.pickup,
      destination: createRideDto.destination,
      rideType: createRideDto.rideType,
    });

    const ride = await this.prisma.ride.create({
      data: {
        riderId,
        pickupLat: createRideDto.pickup.lat,
        pickupLng: createRideDto.pickup.lng,
        pickupAddress: createRideDto.pickup.address,
        destinationLat: createRideDto.destination.lat,
        destinationLng: createRideDto.destination.lng,
        destinationAddress: createRideDto.destination.address,
        fare: fareCalculation.finalFare,
        paymentMethod: createRideDto.paymentMethod as any,
        notes: createRideDto.notes,
        status: 'pending',
        // Cash payment specific fields
        isCashPayment: createRideDto.paymentMethod === 'cash',
        // Store additional ride information in metadata
        metadata: {
          rideType: createRideDto.rideType,
          distance: fareCalculation.distance,
          fareBreakdown: fareCalculation.breakdown,
        },
      },
      include: {
        rider: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          }
        },
        driver: true,
      },
    });

    // Find nearby available drivers
    const nearbyDrivers = await this.findNearbyRides(
      createRideDto.pickup.lat,
      createRideDto.pickup.lng,
      5000 // 5km radius
    );

    // If no drivers found, handle the edge case
    if (nearbyDrivers.length === 0) {
      return this.edgeCaseService.handleNoDriverFound(ride.id, riderId);
    }

    // TODO: Emit WebSocket event for nearby drivers
    // TODO: Send push notifications to nearby drivers

    return {
      ...ride,
      fareCalculation,
      nearbyDriversCount: nearbyDrivers.length,
      estimatedArrival: this.calculateEstimatedArrival(nearbyDrivers),
    };
  }

  async create(rideData: any): Promise<any> {
    const ride = await this.prisma.ride.create({
      data: rideData,
      include: {
        rider: true,
        driver: true,
      },
    });
    return ride;
  }

  async findAll(): Promise<any[]> {
    return this.prisma.ride.findMany({
      include: {
        rider: true,
        driver: true,
      },
    });
  }

  async findOne(id: string): Promise<any> {
    const ride = await this.prisma.ride.findUnique({
      where: { id },
      include: {
        rider: true,
        driver: true,
      },
    });

    if (!ride) {
      throw new NotFoundException('Ride not found');
    }

    return ride;
  }

  async findByRiderId(riderId: string): Promise<any[]> {
    return this.prisma.ride.findMany({
      where: { riderId },
      include: {
        rider: true,
        driver: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByDriverId(driverId: string): Promise<any[]> {
    return this.prisma.ride.findMany({
      where: { driverId },
      include: {
        rider: true,
        driver: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(id: string, status: string, notes?: string): Promise<any> {
    const ride = await this.prisma.ride.update({
      where: { id },
      data: { 
        status: status as any,
        ...(notes && { notes })
      },
      include: {
        rider: true,
        driver: true,
      },
    });
    return ride;
  }



  async completeRide(rideId: string, driverId: string): Promise<any> {
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
      include: { driver: true }
    });

    if (!ride) {
      throw new NotFoundException('Ride not found');
    }

    if (ride.driverId !== driverId) {
      throw new ForbiddenException('You can only complete your own rides');
    }

    if (ride.status !== 'started') {
      throw new BadRequestException('Ride must be started before completion');
    }

    const updatedRide = await this.prisma.ride.update({
      where: { id: rideId },
      data: { status: 'completed' },
      include: {
        rider: true,
        driver: true,
      },
    });

    // Make driver available again
    await this.prisma.driver.update({
      where: { id: driverId },
      data: { status: 'available' }
    });

    // Process payment based on payment method
    if (ride.paymentMethod === 'cash') {
      // For cash payments, we don't process payment immediately
      // Payment will be confirmed by both parties after ride completion
      console.log('Cash payment ride completed - waiting for mutual confirmation');
    } else {
      // Process digital payments immediately
      try {
        await this.paymentsService.createPayment({
          userId: ride.riderId,
          amount: Number(ride.fare),
          currency: 'KES',
          method: ride.paymentMethod as any,
          description: `Ride payment for ride ${rideId}`,
          rideId: rideId,
        });
      } catch (error) {
        // Log payment error but don't fail the ride completion
        console.error('Payment processing failed:', error);
      }
    }

    return updatedRide;
  }

  async findNearbyRides(lat: number, lng: number, radius: number = 5000): Promise<any[]> {
    // This is a simplified implementation
    // In production, you'd use PostGIS or similar for proper geographic queries
    const rides = await this.prisma.ride.findMany({
      where: {
        status: 'pending',
        // Add geographic filtering here
      },
      include: {
        rider: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          }
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return rides;
  }

  async remove(id: string): Promise<any> {
    const ride = await this.prisma.ride.findUnique({ where: { id } });
    if (!ride) {
      throw new NotFoundException('Ride not found');
    }

    return this.prisma.ride.delete({ where: { id } });
  }

  async update(id: string, updateData: any): Promise<any> {
    const ride = await this.prisma.ride.update({
      where: { id },
      data: updateData,
      include: {
        rider: true,
        driver: true,
      },
    });
    return ride;
  }

  /**
   * Calculate fare estimate for a ride
   */
  async calculateFareEstimate(pickup: any, destination: any, rideType: RideType = RideType.BIKE) {
    return this.fareCalculationService.calculateFare({
      pickup,
      destination,
      rideType,
    });
  }

  /**
   * Get available ride types
   */
  getRideTypes() {
    return this.fareCalculationService.getRideTypes();
  }

  /**
   * Rate a ride (passenger rates driver)
   */
  async rateRide(ratingDto: CreateRatingDto, userId: string) {
    const ride = await this.prisma.ride.findUnique({
      where: { id: ratingDto.rideId },
      include: { 
        driver: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
            user: {
              select: {
                name: true,
                phone: true,
              }
            }
          }
        }, 
        rider: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        }
      },
    });

    if (!ride) {
      throw new NotFoundException('Ride not found');
    }

    if (ride.riderId !== userId) {
      throw new ForbiddenException('You can only rate your own rides');
    }

    if (ride.status !== 'completed') {
      throw new BadRequestException('You can only rate completed rides');
    }

    // Create rating
    const rating = await this.prisma.rating.create({
      data: {
        rating: ratingDto.rating,
        comment: ratingDto.comment,
        userId,
        driverId: ride.driverId,
        rideId: ratingDto.rideId,
      },
    });

    // Update driver's average rating
    await this.updateDriverRating(ride.driverId);

    return rating;
  }

  /**
   * Update driver's average rating
   */
  private async updateDriverRating(driverId: string) {
    const ratings = await this.prisma.rating.findMany({
      where: { driverId },
      select: { rating: true },
    });

    const averageRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;

    await this.prisma.driver.update({
      where: { id: driverId },
      data: { rating: Math.round(averageRating) },
    });
  }

  /**
   * Get ride history for a user
   */
  async getRideHistory(userId: string, limit: number = 20, offset: number = 0) {
    const rides = await this.prisma.ride.findMany({
      where: { riderId: userId },
      include: {
        driver: {
          select: {
            id: true,
            user: {
              select: {
                name: true,
                phone: true,
                rating: true,
              }
            },
            vehicles: {
              select: {
                brand: true,
                model: true,
                numberPlate: true,
                color: true,
              }
            }
          }
        },
        ratings: {
          where: { userId },
          select: {
            rating: true,
            comment: true,
            createdAt: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return rides;
  }

  /**
   * Get driver's ride history
   */
  async getDriverRideHistory(driverId: string, limit: number = 20, offset: number = 0) {
    const rides = await this.prisma.ride.findMany({
      where: { driverId },
      include: {
        rider: {
          select: {
            id: true,
            name: true,
            phone: true,
            rating: true,
          }
        },
        ratings: {
          where: { driverId },
          select: {
            rating: true,
            comment: true,
            createdAt: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return rides;
  }

  /**
   * Get ride receipt
   */
  async getRideReceipt(rideId: string, userId: string) {
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
      include: {
        rider: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        },
        driver: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
            user: {
              select: {
                name: true,
                phone: true,
              }
            },
            vehicles: {
              select: {
                brand: true,
                model: true,
                numberPlate: true,
              }
            }
          }
        },
        payments: {
          where: { status: 'completed' },
          select: {
            amount: true,
            currency: true,
            method: true,
            createdAt: true,
          }
        }
      },
    });

    if (!ride) {
      throw new NotFoundException('Ride not found');
    }

    if (ride.riderId !== userId) {
      throw new ForbiddenException('You can only view your own ride receipts');
    }

    return {
      rideId: ride.id,
      passenger: ride.rider,
      driver: ride.driver,
      pickup: {
        address: ride.pickupAddress,
        coordinates: { lat: ride.pickupLat, lng: ride.pickupLng },
      },
      destination: {
        address: ride.destinationAddress,
        coordinates: { lat: ride.destinationLat, lng: ride.destinationLng },
      },
      fare: {
        amount: ride.fare,
        currency: 'KSH',
        breakdown: (ride.metadata as any)?.fareBreakdown,
      },
      payment: ride.payments?.[0] || null,
      status: ride.status,
      createdAt: ride.createdAt,
      completedAt: ride.updatedAt,
    };
  }

  /**
   * Handle no driver found scenario
   */
  async handleNoDriverFound(rideId: string, passengerId: string) {
    return this.edgeCaseService.handleNoDriverFound(rideId, passengerId);
  }

  /**
   * Cancel ride (passenger)
   */
  async cancelRide(rideId: string, passengerId: string, reason?: string) {
    // Check cancellation eligibility and process fine if needed
    const cancellationResult = await this.cancellationFineService.processCancellation(
      passengerId, 
      rideId, 
      reason
    );

    // Update ride status
    await this.prisma.ride.update({
      where: { id: rideId },
      data: {
        status: 'cancelled_by_passenger',
        metadata: {
          ...await this.getRideMetadata(rideId),
          cancellationReason: reason || 'Passenger cancelled',
          cancellationResult,
          cancelledAt: new Date(),
        },
      },
    });

    return {
      ...cancellationResult,
      rideId,
      status: 'cancelled',
    };
  }

  /**
   * Cancel ride (driver)
   */
  async driverCancelRide(rideId: string, driverId: string, reason?: string) {
    return this.edgeCaseService.handleDriverCancellation(rideId, driverId, reason);
  }

  /**
   * Report passenger no-show
   */
  async reportNoShow(rideId: string, driverId: string) {
    return this.edgeCaseService.handlePassengerNoShow(rideId, driverId);
  }

  /**
   * Change destination mid-ride
   */
  async changeDestination(
    rideId: string,
    newDestination: { lat: number; lng: number; address: string },
    driverId: string
  ) {
    return this.edgeCaseService.handleDestinationChange(rideId, newDestination, driverId);
  }

  /**
   * Report emergency
   */
  async reportEmergency(
    rideId: string,
    userId: string,
    emergencyType: 'police' | 'helpline' | 'admin'
  ) {
    return this.edgeCaseService.handleEmergency(rideId, userId, emergencyType);
  }

  /**
   * Handle payment failure
   */
  async handlePaymentFailure(rideId: string, paymentMethod: string, error: string) {
    return this.edgeCaseService.handlePaymentFailure(rideId, paymentMethod, error);
  }

  /**
   * Retry driver search
   */
  async retryDriverSearch(rideId: string, passengerId: string) {
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
      include: { 
        driver: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
            user: {
              select: {
                name: true,
                phone: true,
              }
            }
          }
        }, 
        rider: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        }
      }
    });

    if (!ride) {
      throw new NotFoundException('Ride not found');
    }

    if (ride.riderId !== passengerId) {
      throw new ForbiddenException('You can only retry your own rides');
    }

    // Find nearby drivers again
    const nearbyDrivers = await this.findNearbyRides(
      ride.pickupLat,
      ride.pickupLng,
      5000
    );

    if (nearbyDrivers.length === 0) {
      return this.edgeCaseService.handleNoDriverFound(rideId, passengerId);
    }

    // Update ride status back to pending
    await this.prisma.ride.update({
      where: { id: rideId },
      data: { status: 'pending' },
    });

    return {
      status: 'searching',
      message: 'Searching for drivers...',
      nearbyDriversCount: nearbyDrivers.length,
    };
  }

  /**
   * Get fare breakdown for dispute resolution
   */
  async getFareBreakdown(rideId: string, userId: string) {
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
      include: { 
        driver: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
            user: {
              select: {
                name: true,
                phone: true,
              }
            }
          }
        }, 
        rider: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        }
      }
    });

    if (!ride) {
      throw new NotFoundException('Ride not found');
    }

    if (ride.riderId !== userId) {
      throw new ForbiddenException('You can only view your own ride details');
    }

    return {
      rideId: ride.id,
      fare: ride.fare,
      currency: 'KSH',
      breakdown: (ride.metadata as any)?.fareBreakdown || {},
      distance: (ride.metadata as any)?.distance || 0,
      rideType: (ride.metadata as any)?.rideType || 'bike',
      pickup: {
        address: ride.pickupAddress,
        coordinates: { lat: ride.pickupLat, lng: ride.pickupLng },
      },
      destination: {
        address: ride.destinationAddress,
        coordinates: { lat: ride.destinationLat, lng: ride.destinationLng },
      },
      createdAt: ride.createdAt,
      completedAt: ride.updatedAt,
    };
  }

  /**
   * Calculate estimated arrival time for drivers
   */
  private calculateEstimatedArrival(drivers: any[]): string {
    if (drivers.length === 0) return 'No drivers available';
    
    // Simple calculation based on distance
    // In a real app, this would use traffic data and driver speed
    const avgDistance = drivers.reduce((sum, driver) => sum + driver.distance, 0) / drivers.length;
    const estimatedMinutes = Math.round(avgDistance / 0.5); // Assuming 30 km/h average speed
    
    if (estimatedMinutes <= 2) return '1-2 min';
    if (estimatedMinutes <= 5) return '2-5 min';
    if (estimatedMinutes <= 10) return '5-10 min';
    return '10+ min';
  }

  /**
   * Get ride metadata helper
   */
  private async getRideMetadata(rideId: string): Promise<any> {
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
      select: { metadata: true },
    });
    return ride?.metadata || {};
  }

  /**
   * Accept ride (Driver only)
   */
  async acceptRide(rideId: string, driverId: string): Promise<any> {
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
    });

    if (!ride) {
      throw new NotFoundException('Ride not found');
    }

    if (ride.status !== 'pending') {
      throw new BadRequestException('Ride is not available for acceptance');
    }

    const updatedRide = await this.prisma.ride.update({
      where: { id: rideId },
      data: {
        driverId,
        status: 'accepted',
        acceptedAt: new Date(),
      },
      include: {
        rider: {
          select: {
            id: true,
            name: true,
            phone: true,
          }
        },
        driver: {
          select: {
            id: true,
            user: {
              select: {
                name: true,
                phone: true,
              }
            }
          }
        }
      },
    });

    return updatedRide;
  }

  /**
   * Decline ride (Driver only)
   */
  async declineRide(rideId: string, driverId: string, reason?: string): Promise<any> {
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
    });

    if (!ride) {
      throw new NotFoundException('Ride not found');
    }

    // Update ride status to declined
    await this.prisma.ride.update({
      where: { id: rideId },
      data: {
        status: 'declined',
        metadata: {
          ...await this.getRideMetadata(rideId),
          declinedBy: driverId,
          declineReason: reason || 'Driver declined',
          declinedAt: new Date(),
        },
      },
    });

    return {
      status: 'declined',
      message: 'Ride declined successfully',
      rideId,
    };
  }

  /**
   * Start ride (Driver only)
   */
  async startRide(rideId: string, driverId: string): Promise<any> {
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
    });

    if (!ride) {
      throw new NotFoundException('Ride not found');
    }

    if (ride.driverId !== driverId) {
      throw new ForbiddenException('You can only start your own rides');
    }

    if (ride.status !== 'accepted') {
      throw new BadRequestException('Ride must be accepted before starting');
    }

    const updatedRide = await this.prisma.ride.update({
      where: { id: rideId },
      data: {
        status: 'started',
        startedAt: new Date(),
      },
      include: {
        rider: true,
        driver: true,
      },
    });

    return updatedRide;
  }

  /**
   * Update driver location
   */
  async updateDriverLocation(driverId: string, location: {
    latitude: number;
    longitude: number;
    heading?: number;
    speed?: number;
  }): Promise<any> {
    await this.prisma.driver.update({
      where: { id: driverId },
      data: {
        currentLat: location.latitude,
        currentLng: location.longitude,
        currentHeading: location.heading,
        currentSpeed: location.speed,
        lastLocationUpdate: new Date(),
      },
    });

    return {
      status: 'success',
      message: 'Location updated successfully',
    };
  }

  /**
   * Set driver availability
   */
  async setDriverAvailability(driverId: string, isAvailable: boolean, reason?: string): Promise<any> {
    await this.prisma.driver.update({
      where: { id: driverId },
      data: {
        isAvailable,
        status: isAvailable ? 'online' : 'offline',
        availabilityReason: reason,
      },
    });

    return {
      status: 'success',
      message: `Driver ${isAvailable ? 'available' : 'unavailable'}`,
      isAvailable,
    };
  }

  /**
   * Get driver earnings
   */
  async getDriverEarnings(driverId: string): Promise<any> {
    const rides = await this.prisma.ride.findMany({
      where: {
        driverId,
        status: 'completed',
      },
      select: {
        fare: true,
        completedAt: true,
      },
    });

    const totalEarnings = rides.reduce((sum, ride) => sum + Number(ride.fare), 0);
    const totalRides = rides.length;

    return {
      totalEarnings,
      totalRides,
      averageEarningsPerRide: totalRides > 0 ? totalEarnings / totalRides : 0,
      currency: 'KSH',
    };
  }

  /**
   * Get driver penalty status
   */
  async getDriverPenaltyStatus(driverId: string): Promise<any> {
    const driver = await this.prisma.driver.findUnique({
      where: { id: driverId },
      select: {
        isActive: true,
        rating: true,
        totalRides: true,
        penalties: true,
      },
    });

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    return {
      isActive: driver.isActive,
      rating: driver.rating,
      totalRides: driver.totalRides,
      penalties: driver.penalties || [],
      status: driver.isActive ? 'active' : 'suspended',
    };
  }

  /**
   * Confirm cash payment (Driver)
   */
  async confirmCashPaymentDriver(rideId: string, driverId: string, confirmed: boolean): Promise<any> {
    return this.cashPaymentService.confirmCashPayment(rideId, driverId, 'driver', confirmed);
  }

  /**
   * Confirm cash payment (Rider)
   */
  async confirmCashPaymentRider(rideId: string, riderId: string, confirmed: boolean): Promise<any> {
    return this.cashPaymentService.confirmCashPayment(rideId, riderId, 'rider', confirmed);
  }

  /**
   * Get cash payment status
   */
  async getCashPaymentStatus(rideId: string, userId: string): Promise<any> {
    return this.cashPaymentService.getCashPaymentStatus(rideId, userId);
  }

  /**
   * Admin resolve cash payment dispute
   */
  async adminResolveCashDispute(rideId: string, adminId: string, resolution: 'confirm' | 'deny', adminNotes: string): Promise<any> {
    return this.cashPaymentService.adminResolveDispute(rideId, adminId, resolution, adminNotes);
  }

  /**
   * Get disputed cash payments for admin
   */
  async getDisputedCashPayments(): Promise<any[]> {
    return this.cashPaymentService.getDisputedCashPayments();
  }

  /**
   * Get cash payment statistics
   */
  async getCashPaymentStats(): Promise<any> {
    return this.cashPaymentService.getCashPaymentStats();
  }

  // Split Fare Methods
  /**
   * Create a split fare ride
   */
  async createSplitFareRide(initiatorId: string, createSplitFareDto: any): Promise<any> {
    // Calculate fare first using actual road distance
    const fareCalculation = await this.fareCalculationService.calculateFare({
      pickup: createSplitFareDto.pickup,
      destination: createSplitFareDto.destination,
      rideType: createSplitFareDto.rideType || 'bike',
    });

    // Prepare split fare data
    const splitFareData = {
      totalFare: createSplitFareDto.totalFare,
      participants: createSplitFareDto.participants,
      isEqualSplit: createSplitFareDto.isEqualSplit || false,
      customAmounts: createSplitFareDto.customAmounts || {},
    };

    // Create the split fare ride
    return this.splitFareService.createSplitFareRide(
      initiatorId,
      {
        pickupLat: createSplitFareDto.pickup.lat,
        pickupLng: createSplitFareDto.pickup.lng,
        pickupAddress: createSplitFareDto.pickup.address,
        destinationLat: createSplitFareDto.destination.lat,
        destinationLng: createSplitFareDto.destination.lng,
        destinationAddress: createSplitFareDto.destination.address,
        fare: createSplitFareDto.totalFare,
        paymentMethod: 'split_fare',
        notes: createSplitFareDto.notes,
        distance: fareCalculation.distance,
      },
      splitFareData
    );
  }

  /**
   * Process split fare payments
   */
  async processSplitFarePayments(rideId: string): Promise<any> {
    return this.splitFareService.processSplitFarePayments(rideId);
  }

  /**
   * Confirm cash payment for split fare
   */
  async confirmSplitFareCashPayment(rideId: string, riderId: string, confirmed: boolean): Promise<any> {
    return this.splitFareService.confirmSplitFareCashPayment(rideId, riderId, confirmed);
  }

  /**
   * Get split fare status
   */
  async getSplitFareStatus(rideId: string): Promise<any> {
    return this.splitFareService.getSplitFareStatus(rideId);
  }

  /**
   * Calculate equal split amounts
   */
  async calculateEqualSplit(totalFare: number, participantCount: number): Promise<number[]> {
    return this.splitFareService.calculateEqualSplit(totalFare, participantCount);
  }

  // GPS Tracking and Fare Adjustment Methods
  /**
   * Start GPS tracking for a ride
   */
  async startGpsTracking(rideId: string, location: { lat: number; lng: number; accuracy?: number }): Promise<any> {
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
    });

    if (!ride) {
      throw new NotFoundException('Ride not found');
    }

    if (ride.status !== 'started') {
      throw new BadRequestException('GPS tracking can only be started for active rides');
    }

    await this.gpsTrackingService.startTracking(rideId, {
      lat: location.lat,
      lng: location.lng,
      timestamp: new Date(),
      accuracy: location.accuracy,
    });

    return { message: 'GPS tracking started successfully' };
  }

  /**
   * Add GPS location to ride track
   */
  async addGpsLocation(rideId: string, location: { lat: number; lng: number; accuracy?: number; speed?: number }): Promise<any> {
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
    });

    if (!ride) {
      throw new NotFoundException('Ride not found');
    }

    if (!['started', 'accepted'].includes(ride.status)) {
      throw new BadRequestException('GPS tracking can only be updated for active rides');
    }

    await this.gpsTrackingService.addLocation(rideId, {
      lat: location.lat,
      lng: location.lng,
      timestamp: new Date(),
      accuracy: location.accuracy,
      speed: location.speed,
    });

    return { message: 'GPS location added successfully' };
  }

  /**
   * Get GPS track for a ride
   */
  async getGpsTrack(rideId: string): Promise<any> {
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
    });

    if (!ride) {
      throw new NotFoundException('Ride not found');
    }

    return this.gpsTrackingService.getTrack(rideId);
  }

  /**
   * Recalculate fare based on actual distance traveled
   */
  async recalculateFare(rideId: string): Promise<any> {
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
    });

    if (!ride) {
      throw new NotFoundException('Ride not found');
    }

    if (ride.status !== 'completed') {
      throw new BadRequestException('Fare can only be recalculated for completed rides');
    }

    // Get actual distance traveled
    const actualMetrics = await this.gpsTrackingService.calculateActualDistance(rideId);
    
    // Get original fare calculation
    const originalFare = ride.metadata as any;
    
    // Recalculate fare based on actual distance
    const recalculatedFare = await this.fareCalculationService.recalculateFare(
      originalFare.fareCalculation,
      actualMetrics.distance,
      actualMetrics.time
    );

    // Update ride with recalculated fare
    const updatedRide = await this.prisma.ride.update({
      where: { id: rideId },
      data: {
        fare: recalculatedFare.finalFare,
        metadata: {
          ...originalFare,
          actualDistance: actualMetrics.distance,
          actualTime: actualMetrics.time,
          recalculatedFare: recalculatedFare,
          fareAdjusted: true,
        },
      },
    });

    return {
      message: 'Fare recalculated successfully',
      originalFare: originalFare.fareCalculation?.finalFare || ride.fare,
      recalculatedFare: recalculatedFare.finalFare,
      actualDistance: actualMetrics.distance,
      originalDistance: originalFare.fareCalculation?.distance || 0,
      difference: actualMetrics.distance - (originalFare.fareCalculation?.distance || 0),
      ride: updatedRide,
    };
  }

  /**
   * Validate if route can be calculated
   */
  async validateRoute(pickup: { lat: number; lng: number }, destination: { lat: number; lng: number }): Promise<any> {
    return this.fareCalculationService.validateRoute(pickup, destination);
  }
}
