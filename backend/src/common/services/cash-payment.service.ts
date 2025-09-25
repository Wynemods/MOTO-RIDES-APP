import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PaymentsService } from '../../payments/payments.service';

export interface CashPaymentConfirmation {
  rideId: string;
  userId: string;
  userType: 'driver' | 'rider';
  confirmed: boolean;
  timestamp: Date;
}

export interface CashPaymentResult {
  success: boolean;
  message: string;
  requiresBothConfirmations: boolean;
  disputeFlagged: boolean;
  commissionDeducted: boolean;
}

@Injectable()
export class CashPaymentService {
  constructor(
    private prisma: PrismaService,
    private paymentsService: PaymentsService,
  ) {}

  /**
   * Confirm cash payment from driver or rider
   */
  async confirmCashPayment(
    rideId: string,
    userId: string,
    userType: 'driver' | 'rider',
    confirmed: boolean
  ): Promise<CashPaymentResult> {
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
      include: { driver: true, rider: true }
    });

    if (!ride) {
      throw new NotFoundException('Ride not found');
    }

    // Verify user has permission to confirm this ride
    if (userType === 'driver' && ride.driverId !== userId) {
      throw new ForbiddenException('You can only confirm your own rides as a driver');
    }

    if (userType === 'rider' && ride.riderId !== userId) {
      throw new ForbiddenException('You can only confirm your own rides as a rider');
    }

    if (!ride.isCashPayment) {
      throw new BadRequestException('This ride is not a cash payment ride');
    }

    if (ride.status !== 'completed') {
      throw new BadRequestException('Ride must be completed before confirming cash payment');
    }

    // Update the appropriate confirmation field
    const updateData: any = {};
    if (userType === 'driver') {
      updateData.driverCashConfirm = confirmed;
    } else {
      updateData.riderCashConfirm = confirmed;
    }

    const updatedRide = await this.prisma.ride.update({
      where: { id: rideId },
      data: updateData,
    });

    // Check if both parties have confirmed
    const bothConfirmed = updatedRide.driverCashConfirm === true && updatedRide.riderCashConfirm === true;
    const bothDenied = updatedRide.driverCashConfirm === false && updatedRide.riderCashConfirm === false;
    const oneConfirmed = (updatedRide.driverCashConfirm === true && updatedRide.riderCashConfirm === false) ||
                       (updatedRide.driverCashConfirm === false && updatedRide.riderCashConfirm === true);

    let result: CashPaymentResult = {
      success: false,
      message: '',
      requiresBothConfirmations: true,
      disputeFlagged: false,
      commissionDeducted: false,
    };

    if (bothConfirmed) {
      // Both confirmed - process commission deduction
      await this.processCashPaymentCommission(rideId);
      result = {
        success: true,
        message: 'Cash payment confirmed by both parties. Commission deducted from driver wallet.',
        requiresBothConfirmations: false,
        disputeFlagged: false,
        commissionDeducted: true,
      };
    } else if (bothDenied) {
      // Both denied - flag for admin review
      await this.flagForDispute(rideId, 'Both parties denied cash payment');
      result = {
        success: false,
        message: 'Both parties denied cash payment. Case flagged for admin review.',
        requiresBothConfirmations: false,
        disputeFlagged: true,
        commissionDeducted: false,
      };
    } else if (oneConfirmed) {
      // Only one confirmed - wait for the other
      result = {
        success: false,
        message: `Waiting for ${userType === 'driver' ? 'rider' : 'driver'} confirmation.`,
        requiresBothConfirmations: true,
        disputeFlagged: false,
        commissionDeducted: false,
      };
    }

    return result;
  }

  /**
   * Process commission deduction for cash payments
   */
  private async processCashPaymentCommission(rideId: string): Promise<void> {
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
      include: { driver: true }
    });

    if (!ride || !ride.driverId) {
      throw new NotFoundException('Ride or driver not found');
    }

    // Calculate commission (e.g., 10% of fare)
    const commissionRate = 0.10; // 10% commission
    const commissionAmount = Number(ride.fare) * commissionRate;

    // Deduct commission from driver's wallet
    try {
      await this.paymentsService.addToWallet(
        ride.driverId,
        -commissionAmount, // Negative amount for deduction
        `Commission for cash ride ${rideId}`
      );

      // Update ride with commission details
      await this.prisma.ride.update({
        where: { id: rideId },
        data: {
          commissionDeducted: true,
          commissionAmount,
          cashConfirmDate: new Date(),
        },
      });
    } catch (error) {
      // If wallet deduction fails, flag for admin review
      await this.flagForDispute(rideId, `Failed to deduct commission: ${error.message}`);
      throw new BadRequestException('Failed to process commission. Case flagged for admin review.');
    }
  }

  /**
   * Flag ride for dispute resolution
   */
  private async flagForDispute(rideId: string, reason: string): Promise<void> {
    await this.prisma.ride.update({
      where: { id: rideId },
      data: {
        disputeFlagged: true,
        disputeReason: reason,
      },
    });
  }

  /**
   * Get cash payment status for a ride
   */
  async getCashPaymentStatus(rideId: string, userId: string): Promise<any> {
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
      include: { driver: true, rider: true }
    });

    if (!ride) {
      throw new NotFoundException('Ride not found');
    }

    // Verify user has permission to view this ride
    if (ride.driverId !== userId && ride.riderId !== userId) {
      throw new ForbiddenException('You can only view your own rides');
    }

    return {
      rideId: ride.id,
      isCashPayment: ride.isCashPayment,
      driverConfirmed: ride.driverCashConfirm,
      riderConfirmed: ride.riderCashConfirm,
      bothConfirmed: ride.driverCashConfirm === true && ride.riderCashConfirm === true,
      commissionDeducted: ride.commissionDeducted,
      commissionAmount: ride.commissionAmount,
      disputeFlagged: ride.disputeFlagged,
      disputeReason: ride.disputeReason,
      cashConfirmDate: ride.cashConfirmDate,
      fare: ride.fare,
      currency: 'KSH',
    };
  }

  /**
   * Admin override for dispute resolution
   */
  async adminResolveDispute(
    rideId: string,
    adminId: string,
    resolution: 'confirm' | 'deny',
    adminNotes: string
  ): Promise<any> {
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
    });

    if (!ride) {
      throw new NotFoundException('Ride not found');
    }

    if (!ride.disputeFlagged) {
      throw new BadRequestException('This ride is not flagged for dispute');
    }

    let updateData: any = {
      adminResolved: true,
      adminResolution: adminNotes,
    };

    if (resolution === 'confirm') {
      // Admin confirms cash payment - process commission
      await this.processCashPaymentCommission(rideId);
      updateData.driverCashConfirm = true;
      updateData.riderCashConfirm = true;
    } else {
      // Admin denies - no commission deduction
      updateData.driverCashConfirm = false;
      updateData.riderCashConfirm = false;
    }

    const updatedRide = await this.prisma.ride.update({
      where: { id: rideId },
      data: updateData,
    });

    return {
      success: true,
      message: `Dispute resolved by admin. Resolution: ${resolution}`,
      ride: updatedRide,
    };
  }

  /**
   * Get all disputed cash payments for admin review
   */
  async getDisputedCashPayments(): Promise<any[]> {
    return this.prisma.ride.findMany({
      where: {
        isCashPayment: true,
        disputeFlagged: true,
        adminResolved: false,
      },
      include: {
        driver: {
          select: {
            id: true,
            user: {
              select: {
                name: true,
                phone: true,
                email: true,
              }
            }
          }
        },
        rider: {
          select: {
            name: true,
            phone: true,
            email: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get cash payment statistics
   */
  async getCashPaymentStats(): Promise<any> {
    const totalCashRides = await this.prisma.ride.count({
      where: { isCashPayment: true },
    });

    const confirmedCashRides = await this.prisma.ride.count({
      where: {
        isCashPayment: true,
        driverCashConfirm: true,
        riderCashConfirm: true,
      },
    });

    const disputedCashRides = await this.prisma.ride.count({
      where: {
        isCashPayment: true,
        disputeFlagged: true,
      },
    });

    const totalCommission = await this.prisma.ride.aggregate({
      where: {
        isCashPayment: true,
        commissionDeducted: true,
      },
      _sum: {
        commissionAmount: true,
      },
    });

    return {
      totalCashRides,
      confirmedCashRides,
      disputedCashRides,
      pendingConfirmations: totalCashRides - confirmedCashRides - disputedCashRides,
      totalCommissionCollected: totalCommission._sum.commissionAmount || 0,
      currency: 'KSH',
    };
  }
}
