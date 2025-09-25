import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PaymentsService } from '../../payments/payments.service';
import { MpesaService } from '../../payments/services/mpesa.service';

export interface SplitFareParticipant {
  riderId: string;
  name: string;
  phone: string;
  amount: number;
  paymentMethod: 'mpesa' | 'cash';
}

export interface SplitFareData {
  totalFare: number;
  participants: SplitFareParticipant[];
  isEqualSplit: boolean;
  customAmounts: { [riderId: string]: number };
}

export interface SplitFareResult {
  success: boolean;
  message: string;
  rideId: string;
  splitFarePayments: any[];
  totalCollected: number;
  driverEarnings: number;
  appCommission: number;
}

@Injectable()
export class SplitFareService {
  constructor(
    private prisma: PrismaService,
    private paymentsService: PaymentsService,
    private mpesaService: MpesaService,
  ) {}

  /**
   * Create a split fare ride
   */
  async createSplitFareRide(
    initiatorId: string,
    rideData: any,
    splitFareData: SplitFareData
  ): Promise<SplitFareResult> {
    // Validate split fare data
    this.validateSplitFareData(splitFareData);

    // Calculate commission
    const commission = this.calculateCommission(rideData.distance);
    const driverEarnings = splitFareData.totalFare - commission;

    // Create the ride with split fare data
    const ride = await this.prisma.ride.create({
      data: {
        ...rideData,
        riderId: initiatorId,
        isSplitFare: true,
        splitFareData: splitFareData,
        totalFare: splitFareData.totalFare,
        driverEarnings,
        appCommission: commission,
        fundsLocked: true,
        status: 'pending',
      },
    });

    // Create split fare payment records
    const splitFarePayments = await this.createSplitFarePayments(ride.id, splitFareData.participants);

    return {
      success: true,
      message: 'Split fare ride created successfully',
      rideId: ride.id,
      splitFarePayments,
      totalCollected: splitFareData.totalFare,
      driverEarnings,
      appCommission: commission,
    };
  }

  /**
   * Process split fare payments
   */
  async processSplitFarePayments(rideId: string): Promise<SplitFareResult> {
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
      include: { splitFarePayments: { include: { rider: true } } },
    });

    if (!ride) {
      throw new NotFoundException('Ride not found');
    }

    if (!ride.isSplitFare) {
      throw new BadRequestException('This is not a split fare ride');
    }

    const results = [];
    let totalCollected = 0;

    // Process each participant's payment
    for (const payment of ride.splitFarePayments) {
      try {
        if (payment.paymentMethod === 'mpesa') {
          const result = await this.processMpesaPayment(payment);
          if (result.success) {
            totalCollected += Number(payment.amount);
            results.push({ ...payment, status: 'completed' });
          } else {
            results.push({ ...payment, status: 'failed', error: result.message });
          }
        } else if (payment.paymentMethod === 'cash') {
          // For cash payments, we wait for confirmation
          results.push({ ...payment, status: 'pending' });
        }
      } catch (error) {
        results.push({ ...payment, status: 'failed', error: error.message });
      }
    }

    // Check if all payments are processed
    const allProcessed = results.every(r => r.status === 'completed' || r.status === 'pending');
    
    if (allProcessed) {
      // Update ride status to accepted
      await this.prisma.ride.update({
        where: { id: rideId },
        data: { status: 'accepted' },
      });
    }

    return {
      success: allProcessed,
      message: allProcessed ? 'All payments processed successfully' : 'Some payments failed',
      rideId,
      splitFarePayments: results,
      totalCollected,
      driverEarnings: Number(ride.driverEarnings),
      appCommission: Number(ride.appCommission),
    };
  }

  /**
   * Confirm cash payment for split fare
   */
  async confirmSplitFareCashPayment(
    rideId: string,
    riderId: string,
    confirmed: boolean
  ): Promise<any> {
    const payment = await this.prisma.splitFarePayment.findFirst({
      where: {
        rideId,
        riderId,
        paymentMethod: 'cash',
      },
    });

    if (!payment) {
      throw new NotFoundException('Split fare payment not found');
    }

    const updatedPayment = await this.prisma.splitFarePayment.update({
      where: { id: payment.id },
      data: {
        cashConfirmed: confirmed,
        paymentStatus: confirmed ? 'completed' : 'failed',
        confirmedAt: confirmed ? new Date() : null,
      },
    });

    // Check if all cash payments are confirmed
    const allCashPayments = await this.prisma.splitFarePayment.findMany({
      where: {
        rideId,
        paymentMethod: 'cash',
      },
    });

    const allConfirmed = allCashPayments.every(p => p.cashConfirmed === true);

    if (allConfirmed) {
      // Deposit all confirmed payments to driver's wallet
      await this.depositToDriverWallet(rideId);
    }

    return updatedPayment;
  }

  /**
   * Deposit confirmed payments to driver's wallet
   */
  async depositToDriverWallet(rideId: string): Promise<void> {
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
      include: { driver: true },
    });

    if (!ride || !ride.driverId) {
      throw new NotFoundException('Ride or driver not found');
    }

    // Get all completed payments
    const completedPayments = await this.prisma.splitFarePayment.findMany({
      where: {
        rideId,
        paymentStatus: 'completed',
      },
    });

    const totalAmount = completedPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);

    // Deposit to driver's wallet
    await this.paymentsService.addToWallet(
      ride.driverId,
      totalAmount,
      `Split fare payment for ride ${rideId}`
    );

    // Update ride status
    await this.prisma.ride.update({
      where: { id: rideId },
      data: {
        fundsReleased: true,
        fundsLocked: false,
      },
    });
  }

  /**
   * Get split fare status
   */
  async getSplitFareStatus(rideId: string): Promise<any> {
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
      include: {
        splitFarePayments: {
          include: { rider: true },
        },
        driver: true,
      },
    });

    if (!ride) {
      throw new NotFoundException('Ride not found');
    }

    const totalPayments = ride.splitFarePayments.length;
    const completedPayments = ride.splitFarePayments.filter(p => p.paymentStatus === 'completed').length;
    const pendingPayments = ride.splitFarePayments.filter(p => p.paymentStatus === 'pending').length;
    const failedPayments = ride.splitFarePayments.filter(p => p.paymentStatus === 'failed').length;

    return {
      rideId: ride.id,
      totalFare: ride.totalFare,
      driverEarnings: ride.driverEarnings,
      appCommission: ride.appCommission,
      fundsLocked: ride.fundsLocked,
      fundsReleased: ride.fundsReleased,
      paymentSummary: {
        total: totalPayments,
        completed: completedPayments,
        pending: pendingPayments,
        failed: failedPayments,
      },
      participants: ride.splitFarePayments.map(payment => ({
        riderId: payment.riderId,
        riderName: payment.rider.name,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        status: payment.paymentStatus,
        cashConfirmed: payment.cashConfirmed,
      })),
    };
  }

  /**
   * Calculate equal split amounts
   */
  calculateEqualSplit(totalFare: number, participantCount: number): number[] {
    const baseAmount = Math.floor(totalFare / participantCount);
    const remainder = totalFare - (baseAmount * participantCount);
    
    const amounts = new Array(participantCount).fill(baseAmount);
    
    // Distribute remainder to first few participants
    for (let i = 0; i < remainder; i++) {
      amounts[i] += 1;
    }
    
    return amounts;
  }

  /**
   * Validate split fare data
   */
  private validateSplitFareData(splitFareData: SplitFareData): void {
    const totalAmount = splitFareData.participants.reduce((sum, p) => sum + p.amount, 0);
    
    if (Math.abs(totalAmount - splitFareData.totalFare) > 0.01) {
      throw new BadRequestException('Sum of participant amounts does not equal total fare');
    }

    if (splitFareData.participants.length < 2) {
      throw new BadRequestException('Split fare requires at least 2 participants');
    }

    // Validate each participant
    for (const participant of splitFareData.participants) {
      if (participant.amount <= 0) {
        throw new BadRequestException('Participant amount must be greater than 0');
      }
      if (!participant.phone || !participant.name) {
        throw new BadRequestException('Participant phone and name are required');
      }
    }
  }

  /**
   * Calculate commission based on distance
   */
  private calculateCommission(distanceKm: number): number {
    const baseFare = 50;
    const perKmRate = 60;
    const commissionPerKm = 17;
    
    return distanceKm * commissionPerKm;
  }

  /**
   * Process M-Pesa payment for split fare
   */
  private async processMpesaPayment(payment: any): Promise<{ success: boolean; message: string }> {
    try {
      const mpesaResponse = await this.mpesaService.initiateSTKPush(
        payment.rider.phone,
        Number(payment.amount),
        `SPLIT-${payment.rideId}-${payment.id}`,
        `Split fare payment for ride ${payment.rideId}`
      );

      // Update payment record
      await this.prisma.splitFarePayment.update({
        where: { id: payment.id },
        data: {
          mpesaRequestId: mpesaResponse.CheckoutRequestID,
          paymentStatus: 'processing',
        },
      });

      return {
        success: true,
        message: 'M-Pesa payment initiated successfully',
      };
    } catch (error) {
      await this.prisma.splitFarePayment.update({
        where: { id: payment.id },
        data: { paymentStatus: 'failed' },
      });

      return {
        success: false,
        message: error.message || 'M-Pesa payment failed',
      };
    }
  }

  /**
   * Create split fare payment records
   */
  private async createSplitFarePayments(rideId: string, participants: SplitFareParticipant[]): Promise<any[]> {
    const payments = [];

    for (const participant of participants) {
      const payment = await this.prisma.splitFarePayment.create({
        data: {
          rideId,
          riderId: participant.riderId,
          amount: participant.amount,
          paymentMethod: participant.paymentMethod as any,
          paymentStatus: 'pending',
        },
        include: { rider: true },
      });
      payments.push(payment);
    }

    return payments;
  }

  /**
   * Handle M-Pesa callback for split fare
   */
  async handleMpesaCallback(callbackData: any): Promise<void> {
    try {
      const checkoutRequestId = callbackData.Body.stkCallback.CheckoutRequestID;
      
      // Find split fare payment by checkout request ID
      const payment = await this.prisma.splitFarePayment.findFirst({
        where: { mpesaRequestId: checkoutRequestId },
        include: { ride: true },
      });

      if (!payment) {
        throw new NotFoundException('Split fare payment not found');
      }

      // Process callback
      const result = this.mpesaService.processCallback(callbackData.Body.stkCallback);

      if (result.success) {
        await this.prisma.splitFarePayment.update({
          where: { id: payment.id },
          data: {
            paymentStatus: 'completed',
            mpesaReceiptNumber: result.transactionId,
            confirmedAt: new Date(),
          },
        });

        // Check if all payments are completed
        const allPayments = await this.prisma.splitFarePayment.findMany({
          where: { rideId: payment.rideId },
        });

        const allCompleted = allPayments.every(p => p.paymentStatus === 'completed');

        if (allCompleted) {
          // Deposit all payments to driver's wallet
          await this.depositToDriverWallet(payment.rideId);
        }
      } else {
        await this.prisma.splitFarePayment.update({
          where: { id: payment.id },
          data: { paymentStatus: 'failed' },
        });
      }
    } catch (error) {
      console.error('Split fare M-Pesa callback error:', error);
      throw error;
    }
  }
}
