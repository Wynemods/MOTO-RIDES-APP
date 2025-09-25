import { Injectable, Logger, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { PaymentsService } from '../../payments/payments.service';

export interface CancellationFineConfig {
  freeCancellations: number;
  fineAmount: number;
  currency: string;
}

export interface CancellationResult {
  canCancel: boolean;
  cancellationCount: number;
  hasActiveFine: boolean;
  fineAmount?: number;
  message: string;
  warning?: string;
}

export interface FinePaymentResult {
  success: boolean;
  message: string;
  fineAmount?: number;
  paymentId?: string;
}

@Injectable()
export class CancellationFineService {
  private readonly logger = new Logger(CancellationFineService.name);
  
  private readonly config: CancellationFineConfig = {
    freeCancellations: 5,
    fineAmount: 200, // KSH
    currency: 'KSH',
  };

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private paymentsService: PaymentsService,
  ) {}

  /**
   * Check if passenger can cancel a ride
   */
  async checkCancellationEligibility(userId: string): Promise<CancellationResult> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        cancellationCount: true,
        hasActiveFine: true,
        fineAmount: true,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // If user has an active fine, they cannot cancel
    if (user.hasActiveFine) {
      return {
        canCancel: false,
        cancellationCount: user.cancellationCount,
        hasActiveFine: true,
        fineAmount: Number(user.fineAmount),
        message: 'You must pay your outstanding fine before cancelling rides.',
      };
    }

    // Check if this would be the 6th cancellation
    if (user.cancellationCount >= this.config.freeCancellations) {
      return {
        canCancel: true,
        cancellationCount: user.cancellationCount,
        hasActiveFine: false,
        fineAmount: this.config.fineAmount,
        message: `This will be your ${user.cancellationCount + 1}th cancellation. A fine of ${this.config.fineAmount} ${this.config.currency} will be applied.`,
        warning: `You have used all ${this.config.freeCancellations} free cancellations.`,
      };
    }

    // Free cancellation
    const remainingFree = this.config.freeCancellations - user.cancellationCount;
    return {
      canCancel: true,
      cancellationCount: user.cancellationCount,
      hasActiveFine: false,
      message: `You have ${remainingFree} free cancellation${remainingFree === 1 ? '' : 's'} remaining.`,
    };
  }

  /**
   * Process ride cancellation and apply fine if necessary
   */
  async processCancellation(userId: string, rideId: string, reason?: string): Promise<CancellationResult> {
    const eligibility = await this.checkCancellationEligibility(userId);
    
    if (!eligibility.canCancel) {
      throw new ForbiddenException(eligibility.message);
    }

    // Increment cancellation count
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        cancellationCount: {
          increment: 1,
        },
      },
    });

    const newCancellationCount = updatedUser.cancellationCount;

    // Check if fine should be applied
    if (newCancellationCount > this.config.freeCancellations) {
      await this.applyFine(userId, rideId, reason);
      
      return {
        canCancel: true,
        cancellationCount: newCancellationCount,
        hasActiveFine: true,
        fineAmount: this.config.fineAmount,
        message: `Ride cancelled. A fine of ${this.config.fineAmount} ${this.config.currency} has been applied to your account.`,
      };
    }

    // Send notification for free cancellation
    await this.notificationsService.sendNotification({
      userId,
      title: 'Ride Cancelled',
      message: eligibility.message,
      type: 'system',
      data: { rideId, reason, cancellationCount: newCancellationCount },
    });

    return {
      canCancel: true,
      cancellationCount: newCancellationCount,
      hasActiveFine: false,
      message: eligibility.message,
    };
  }

  /**
   * Apply fine to user account
   */
  private async applyFine(userId: string, rideId: string, reason?: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        hasActiveFine: true,
        fineAmount: this.config.fineAmount,
      },
    });

    // Send fine notification
    await this.notificationsService.sendNotification({
      userId,
      title: 'Cancellation Fine Applied',
      message: `A fine of ${this.config.fineAmount} ${this.config.currency} has been applied due to excessive cancellations. You must pay this fine before booking new rides.`,
      type: 'system',
      data: { 
        rideId, 
        reason, 
        fineAmount: this.config.fineAmount,
        currency: this.config.currency,
      },
    });

    this.logger.log(`Fine applied to user ${userId}: ${this.config.fineAmount} ${this.config.currency}`);
  }

  /**
   * Check if user can request new rides
   */
  async canRequestRide(userId: string): Promise<{ canRequest: boolean; reason?: string; fineAmount?: number }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        hasActiveFine: true,
        fineAmount: true,
        cancellationCount: true,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.hasActiveFine) {
      return {
        canRequest: false,
        reason: 'You must clear your fine before booking again.',
        fineAmount: Number(user.fineAmount),
      };
    }

    return { canRequest: true };
  }

  /**
   * Get user's fine status
   */
  async getFineStatus(userId: string): Promise<{
    hasActiveFine: boolean;
    fineAmount?: number;
    currency: string;
    cancellationCount: number;
    remainingFree: number;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        hasActiveFine: true,
        fineAmount: true,
        cancellationCount: true,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    return {
      hasActiveFine: user.hasActiveFine,
      fineAmount: user.fineAmount ? Number(user.fineAmount) : undefined,
      currency: this.config.currency,
      cancellationCount: user.cancellationCount,
      remainingFree: Math.max(0, this.config.freeCancellations - user.cancellationCount),
    };
  }

  /**
   * Process fine payment
   */
  async payFine(
    userId: string, 
    paymentMethod: 'cash' | 'mpesa' | 'card' | 'wallet',
    paymentData?: any
  ): Promise<FinePaymentResult> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        hasActiveFine: true,
        fineAmount: true,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!user.hasActiveFine) {
      throw new BadRequestException('No active fine to pay');
    }

    const fineAmount = Number(user.fineAmount);

    try {
      // Process payment based on method
      let paymentResult;
      switch (paymentMethod) {
        case 'cash':
          // For cash payments, we assume it's paid immediately
          paymentResult = { success: true, paymentId: `cash_${Date.now()}` };
          break;
        case 'mpesa':
        case 'card':
        case 'wallet':
          // Process through payments service
          paymentResult = await this.paymentsService.createPayment({
            userId,
            amount: fineAmount,
            currency: this.config.currency,
            method: paymentMethod as any,
            description: `Cancellation fine payment - ${this.config.currency} ${fineAmount}`,
          });
          break;
        default:
          throw new BadRequestException('Invalid payment method');
      }

      if (paymentResult.success) {
        // Clear the fine
        await this.clearFine(userId, paymentResult.paymentId);
        
        return {
          success: true,
          message: `Fine of ${fineAmount} ${this.config.currency} paid successfully. You can now request rides again.`,
          fineAmount,
          paymentId: paymentResult.paymentId,
        };
      } else {
        return {
          success: false,
          message: 'Payment failed. Please try again.',
          fineAmount,
        };
      }
    } catch (error) {
      this.logger.error('Fine payment failed:', error);
      return {
        success: false,
        message: 'Payment processing failed. Please try again.',
        fineAmount,
      };
    }
  }

  /**
   * Clear fine after successful payment
   */
  private async clearFine(userId: string, paymentId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        hasActiveFine: false,
        fineAmount: null,
        finePaidAt: new Date(),
      },
    });

    // Send confirmation notification
    await this.notificationsService.sendNotification({
      userId,
      title: 'Fine Paid Successfully',
      message: 'Your cancellation fine has been paid. You can now request rides again.',
      type: 'system',
      data: { paymentId },
    });

    this.logger.log(`Fine cleared for user ${userId}, payment ID: ${paymentId}`);
  }

  /**
   * Reset cancellation count (admin function)
   */
  async resetCancellationCount(userId: string, adminId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        cancellationCount: 0,
        hasActiveFine: false,
        fineAmount: null,
        finePaidAt: null,
      },
    });

    // Log admin action
    this.logger.log(`Cancellation count reset for user ${userId} by admin ${adminId}`);

    // Notify user
    await this.notificationsService.sendNotification({
      userId,
      title: 'Cancellation Count Reset',
      message: 'Your cancellation count has been reset by an administrator.',
      type: 'system',
      data: { adminId },
    });
  }

  /**
   * Get cancellation statistics
   */
  async getCancellationStats(): Promise<{
    totalUsersWithFines: number;
    totalFineAmount: number;
    averageCancellations: number;
  }> {
    const stats = await this.prisma.user.aggregate({
      _count: {
        id: true,
      },
      _avg: {
        cancellationCount: true,
      },
      _sum: {
        fineAmount: true,
      },
      where: {
        hasActiveFine: true,
      },
    });

    return {
      totalUsersWithFines: stats._count.id,
      totalFineAmount: Number(stats._sum.fineAmount || 0),
      averageCancellations: Number(stats._avg.cancellationCount || 0),
    };
  }
}
