import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';

export interface CancellationFee {
  amount: number;
  currency: string;
  reason: string;
  gracePeriodMinutes: number;
}

export interface NoShowFee {
  amount: number;
  currency: string;
  waitTimeMinutes: number;
}

export interface EmergencyContact {
  type: 'police' | 'helpline' | 'admin';
  number: string;
  name: string;
}

@Injectable()
export class EdgeCaseService {
  private readonly logger = new Logger(EdgeCaseService.name);
  
  // Configuration constants
  private readonly CANCELLATION_FEE = 100; // KSH
  private readonly NO_SHOW_FEE = 150; // KSH
  private readonly GRACE_PERIOD_MINUTES = 5;
  private readonly NO_SHOW_WAIT_MINUTES = 5;
  private readonly LOW_RATING_THRESHOLD = 3.0;
  private readonly RATING_REVIEW_THRESHOLD = 5; // Number of low ratings before review

  private readonly EMERGENCY_CONTACTS: EmergencyContact[] = [
    { type: 'police', number: '999', name: 'Police Emergency' },
    { type: 'helpline', number: '+254-700-000-000', name: 'MOTO Safety Helpline' },
    { type: 'admin', number: '+254-700-000-001', name: 'MOTO Support' },
  ];

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Handle no driver found scenario
   */
  async handleNoDriverFound(rideId: string, passengerId: string): Promise<any> {
    this.logger.log(`No drivers found for ride ${rideId}`);
    
    // Update ride status
    await this.prisma.ride.update({
      where: { id: rideId },
      data: { 
        status: 'no_drivers',
        metadata: {
          ...await this.getRideMetadata(rideId),
          noDriversFound: true,
          lastSearchAttempt: new Date(),
        }
      },
    });

    // Notify passenger
    await this.notificationsService.sendNotification({
      userId: passengerId,
      title: 'No Drivers Available',
      message: 'No drivers available at the moment. Please try again later.',
      type: 'system',
      data: { rideId, retryAfter: 2 }, // Retry after 2 minutes
    });

    return {
      status: 'no_drivers',
      message: 'No drivers available at the moment. Please try again later.',
      retryAfter: 2, // minutes
      rideId,
    };
  }

  /**
   * Handle passenger cancellation
   */
  async handlePassengerCancellation(
    rideId: string, 
    passengerId: string, 
    reason?: string
  ): Promise<any> {
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
      include: { driver: true },
    });

    if (!ride) {
      throw new Error('Ride not found');
    }

    const rideAge = Date.now() - ride.createdAt.getTime();
    const gracePeriodMs = this.GRACE_PERIOD_MINUTES * 60 * 1000;
    const isWithinGracePeriod = rideAge < gracePeriodMs;

    let cancellationFee = 0;
    if (!isWithinGracePeriod) {
      cancellationFee = this.CANCELLATION_FEE;
    }

    // Update ride status
    await this.prisma.ride.update({
      where: { id: rideId },
      data: {
        status: 'cancelled_by_passenger',
        metadata: {
          ...await this.getRideMetadata(rideId),
          cancellationReason: reason || 'Passenger cancelled',
          cancellationFee,
          cancelledAt: new Date(),
        },
      },
    });

    // Notify driver if ride was accepted
    if (ride.driverId) {
      await this.notificationsService.sendNotification({
        userId: ride.driverId,
        title: 'Ride Cancelled',
        message: 'Passenger has cancelled the ride.',
        type: 'system',
        data: { rideId, reason },
      });
    }

    // Process cancellation fee if applicable
    if (cancellationFee > 0) {
      await this.processCancellationFee(passengerId, cancellationFee, rideId);
    }

    return {
      status: 'cancelled',
      cancellationFee,
      message: isWithinGracePeriod 
        ? 'Ride cancelled successfully' 
        : `Ride cancelled. Cancellation fee of ${cancellationFee} KSH applied.`,
    };
  }

  /**
   * Handle driver cancellation
   */
  async handleDriverCancellation(
    rideId: string, 
    driverId: string, 
    reason?: string
  ): Promise<any> {
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
      include: { rider: true },
    });

    if (!ride) {
      throw new Error('Ride not found');
    }

    // Update ride status
    await this.prisma.ride.update({
      where: { id: rideId },
      data: {
        status: 'cancelled_by_driver',
        metadata: {
          ...await this.getRideMetadata(rideId),
          cancellationReason: reason || 'Driver cancelled',
          cancelledAt: new Date(),
        },
      },
    });

    // Notify passenger
    await this.notificationsService.sendNotification({
      userId: ride.riderId,
      title: 'Driver Cancelled',
      message: 'Your driver has cancelled the ride. Finding another driver...',
      type: 'system',
      data: { rideId, reason },
    });

    // Try to find another driver
    const reassignment = await this.findAlternativeDriver(ride);
    
    return {
      status: 'cancelled_by_driver',
      reassignment,
      message: 'Driver cancelled. Looking for another driver...',
    };
  }

  /**
   * Handle passenger no-show
   */
  async handlePassengerNoShow(rideId: string, driverId: string): Promise<any> {
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
      include: { rider: true },
    });

    if (!ride) {
      throw new Error('Ride not found');
    }

    // Update ride status
    await this.prisma.ride.update({
      where: { id: rideId },
      data: {
        status: 'no_show',
        metadata: {
          ...await this.getRideMetadata(rideId),
          noShowAt: new Date(),
          noShowFee: this.NO_SHOW_FEE,
        },
      },
    });

    // Process no-show fee
    await this.processNoShowFee(ride.riderId, this.NO_SHOW_FEE, rideId);

    // Notify passenger
    await this.notificationsService.sendNotification({
      userId: ride.riderId,
      title: 'No Show Fee Applied',
      message: `No show fee of ${this.NO_SHOW_FEE} KSH has been applied to your account.`,
      type: 'system',
      data: { rideId, fee: this.NO_SHOW_FEE },
    });

    return {
      status: 'no_show',
      fee: this.NO_SHOW_FEE,
      message: `Passenger no-show. Fee of ${this.NO_SHOW_FEE} KSH applied.`,
    };
  }

  /**
   * Handle payment failure
   */
  async handlePaymentFailure(
    rideId: string, 
    paymentMethod: string, 
    error: string
  ): Promise<any> {
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
      include: { rider: true },
    });

    if (!ride) {
      throw new Error('Ride not found');
    }

    // Update ride status
    await this.prisma.ride.update({
      where: { id: rideId },
      data: {
        status: 'payment_failed',
        metadata: {
          ...await this.getRideMetadata(rideId),
          paymentFailure: {
            method: paymentMethod,
            error,
            failedAt: new Date(),
          },
        },
      },
    });

    // Notify passenger
    await this.notificationsService.sendNotification({
      userId: ride.riderId,
      title: 'Payment Failed',
      message: 'Payment failed. Please try a different payment method or pay with cash.',
      type: 'system',
      data: { rideId, paymentMethod, error },
    });

    return {
      status: 'payment_failed',
      message: 'Payment failed. Please try a different payment method.',
      alternativeMethods: ['cash', 'wallet', 'mpesa', 'card'].filter(m => m !== paymentMethod),
    };
  }

  /**
   * Handle destination change mid-ride
   */
  async handleDestinationChange(
    rideId: string,
    newDestination: { lat: number; lng: number; address: string },
    driverId: string
  ): Promise<any> {
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
    });

    if (!ride) {
      throw new Error('Ride not found');
    }

    // Calculate new fare
    const newFare = await this.calculateNewFare(
      { lat: ride.pickupLat, lng: ride.pickupLng },
      newDestination,
      (ride.metadata as any)?.rideType || 'bike'
    );

    // Update ride with new destination and fare
    await this.prisma.ride.update({
      where: { id: rideId },
      data: {
        destinationLat: newDestination.lat,
        destinationLng: newDestination.lng,
        destinationAddress: newDestination.address,
        fare: newFare.finalFare,
        metadata: {
          ...await this.getRideMetadata(rideId),
          destinationChanged: true,
          originalFare: ride.fare,
          newFare: newFare.finalFare,
          fareDifference: newFare.finalFare - Number(ride.fare),
          changedAt: new Date(),
        },
      },
    });

    return {
      status: 'destination_changed',
      newFare: newFare.finalFare,
      fareDifference: newFare.finalFare - Number(ride.fare),
      message: 'Destination updated. Fare recalculated.',
    };
  }

  /**
   * Handle emergency situations
   */
  async handleEmergency(
    rideId: string,
    userId: string,
    emergencyType: 'police' | 'helpline' | 'admin'
  ): Promise<any> {
    const contact = this.EMERGENCY_CONTACTS.find(c => c.type === emergencyType);
    
    if (!contact) {
      throw new Error('Invalid emergency type');
    }

    // Log emergency
    await this.prisma.ride.update({
      where: { id: rideId },
      data: {
        metadata: {
          ...await this.getRideMetadata(rideId),
          emergency: {
            type: emergencyType,
            contact: contact.number,
            reportedAt: new Date(),
            reportedBy: userId,
          },
        },
      },
    });

    // Notify admin
    await this.notificationsService.sendNotification({
      userId: 'admin', // This would be an admin user ID
      title: 'Emergency Reported',
      message: `Emergency reported for ride ${rideId}. Contact: ${contact.name} (${contact.number})`,
      type: 'emergency',
      data: { rideId, emergencyType, contact },
    });

    return {
      status: 'emergency_reported',
      contact: contact.number,
      message: `Emergency reported. Contact ${contact.name} at ${contact.number}`,
    };
  }

  /**
   * Handle low rating scenarios
   */
  async handleLowRating(userId: string, userType: 'driver' | 'passenger'): Promise<any> {
    const recentRatings = await this.prisma.rating.findMany({
      where: { 
        [userType === 'driver' ? 'driverId' : 'userId']: userId,
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
      },
      select: { rating: true },
    });

    const averageRating = recentRatings.reduce((sum, r) => sum + r.rating, 0) / recentRatings.length;
    const lowRatings = recentRatings.filter(r => r.rating <= this.LOW_RATING_THRESHOLD).length;

    if (averageRating <= this.LOW_RATING_THRESHOLD && lowRatings >= this.RATING_REVIEW_THRESHOLD) {
      // Flag for review
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          metadata: {
            ...await this.getUserMetadata(userId),
            flaggedForReview: true,
            reviewReason: 'Low ratings',
            averageRating,
            lowRatingCount: lowRatings,
            flaggedAt: new Date(),
          },
        },
      });

      // Notify admin
      await this.notificationsService.sendNotification({
        userId: 'admin',
        title: 'Account Flagged for Review',
        message: `${userType} account flagged due to low ratings (${averageRating.toFixed(1)}/5)`,
        type: 'system',
        data: { userId, userType, averageRating, lowRatings },
      });

      return {
        status: 'flagged_for_review',
        averageRating,
        lowRatingCount: lowRatings,
        message: 'Account flagged for review due to low ratings',
      };
    }

    return {
      status: 'monitoring',
      averageRating,
      lowRatingCount: lowRatings,
      message: 'Account being monitored for rating quality',
    };
  }

  // Helper methods
  private async getRideMetadata(rideId: string): Promise<any> {
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
      select: { metadata: true },
    });
    return ride?.metadata || {};
  }

  private async getUserMetadata(userId: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { metadata: true },
    });
    return user?.metadata || {};
  }

  private async findAlternativeDriver(ride: any): Promise<any> {
    // Implementation to find alternative driver
    // This would integrate with the existing driver search logic
    return { status: 'searching', message: 'Looking for alternative driver...' };
  }

  private async calculateNewFare(
    pickup: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    rideType: string
  ): Promise<any> {
    // This would use the FareCalculationService
    // For now, return a mock calculation
    return {
      finalFare: 500, // Mock calculation
      distance: 8.3,
      currency: 'KSH',
    };
  }

  private async processCancellationFee(userId: string, amount: number, rideId: string): Promise<void> {
    // Process cancellation fee (deduct from wallet, charge card, etc.)
    this.logger.log(`Processing cancellation fee of ${amount} KSH for user ${userId}`);
  }

  private async processNoShowFee(userId: string, amount: number, rideId: string): Promise<void> {
    // Process no-show fee
    this.logger.log(`Processing no-show fee of ${amount} KSH for user ${userId}`);
  }
}
