import { Injectable, HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { MpesaService } from './services/mpesa.service';
import { StripeService } from './services/stripe.service';
import { WalletService } from './services/wallet.service';
import { CreatePaymentDto, PaymentMethod } from './dto/create-payment.dto';
import { MpesaPaymentDto } from './dto/mpesa-payment.dto';
import { StripePaymentDto } from './dto/stripe-payment.dto';

export interface PaymentResult {
  success: boolean;
  paymentId: string;
  status: string;
  message: string;
  data?: any;
}

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private mpesaService: MpesaService,
    private stripeService: StripeService,
    private walletService: WalletService,
  ) {}

  /**
   * Create a new payment
   */
  async createPayment(createPaymentDto: CreatePaymentDto): Promise<PaymentResult> {
    try {
      // Create payment record
      const payment = await this.prisma.payment.create({
        data: {
          userId: createPaymentDto.userId || 'temp', // Will be updated with actual user ID
          amount: createPaymentDto.amount,
          currency: createPaymentDto.currency,
          method: createPaymentDto.method as any,
          description: createPaymentDto.description,
          rideId: createPaymentDto.rideId,
          status: 'PENDING' as any,
          type: 'RIDE_PAYMENT' as any,
          reference: this.generateReference(),
        },
      });

      // Process payment based on method
      switch (createPaymentDto.method) {
        case PaymentMethod.MPESA:
          return await this.processMpesaPayment(payment, createPaymentDto);
        case PaymentMethod.STRIPE:
          return await this.processStripePayment(payment, createPaymentDto);
        case PaymentMethod.WALLET:
          return await this.processWalletPayment(payment, createPaymentDto);
        default:
          throw new HttpException('Invalid payment method', HttpStatus.BAD_REQUEST);
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to create payment', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Process M-Pesa payment
   */
  private async processMpesaPayment(
    payment: any,
    paymentDto: CreatePaymentDto
  ): Promise<PaymentResult> {
    try {
      if (!paymentDto.phoneNumber) {
        throw new HttpException('Phone number is required for M-Pesa payment', HttpStatus.BAD_REQUEST);
      }

      const mpesaResponse = await this.mpesaService.initiateSTKPush(
        paymentDto.phoneNumber,
        payment.amount,
        payment.reference,
        payment.description
      );

      // Update payment with M-Pesa details
      const updatedPayment = await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          externalId: mpesaResponse.CheckoutRequestID,
          metadata: JSON.stringify({
            merchantRequestId: mpesaResponse.MerchantRequestID,
            checkoutRequestId: mpesaResponse.CheckoutRequestID,
            responseCode: mpesaResponse.ResponseCode,
            responseDescription: mpesaResponse.ResponseDescription,
            customerMessage: mpesaResponse.CustomerMessage,
          }),
        },
      });

      return {
        success: true,
        paymentId: payment.id,
        status: 'PENDING',
        message: mpesaResponse.CustomerMessage,
        data: {
          checkoutRequestId: mpesaResponse.CheckoutRequestID,
          merchantRequestId: mpesaResponse.MerchantRequestID,
        },
      };
    } catch (error) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'failed' },
      });
      throw error;
    }
  }

  /**
   * Process Stripe payment
   */
  private async processStripePayment(
    payment: any,
    paymentDto: CreatePaymentDto
  ): Promise<PaymentResult> {
    try {
      if (!paymentDto.email) {
        throw new HttpException('Email is required for Stripe payment', HttpStatus.BAD_REQUEST);
      }

      // Create or get customer
      let customerId = paymentDto.customerId;
      if (!customerId) {
        const customer = await this.stripeService.createCustomer(
          paymentDto.email,
          paymentDto.name,
          paymentDto.phoneNumber
        );
        customerId = customer.id;
      }

      // Create payment intent
      const paymentIntent = await this.stripeService.createPaymentIntent(
        payment.amount,
        payment.currency,
        customerId,
        {
          paymentId: payment.id,
          description: payment.description,
        }
      );

      // Update payment with Stripe details
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          externalId: paymentIntent.id,
          metadata: JSON.stringify({
            clientSecret: paymentIntent.client_secret,
            customerId: customerId,
          }),
        },
      });

      return {
        success: true,
        paymentId: payment.id,
        status: 'PENDING',
        message: 'Payment intent created successfully',
        data: {
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
        },
      };
    } catch (error) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'failed' },
      });
      throw error;
    }
  }

  /**
   * Process wallet payment
   */
  private async processWalletPayment(
    payment: any,
    paymentDto: CreatePaymentDto
  ): Promise<PaymentResult> {
    try {
      // Check if user has sufficient balance
      const canAfford = await this.walletService.canAfford(payment.userId, payment.amount);
      if (!canAfford) {
        throw new HttpException('Insufficient wallet balance', HttpStatus.BAD_REQUEST);
      }

      // Deduct from wallet
      const walletTransaction = await this.walletService.deductFromWallet(
        payment.userId,
        payment.amount,
        payment.description,
        payment.reference
      );

      // Update payment status
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'completed',
          externalId: walletTransaction.id,
        },
      });

      return {
        success: true,
        paymentId: payment.id,
        status: 'COMPLETED',
        message: 'Payment completed successfully',
        data: {
          walletTransactionId: walletTransaction.id,
        },
      };
    } catch (error) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'failed' },
      });
      throw error;
    }
  }

  /**
   * Handle M-Pesa callback
   */
  async handleMpesaCallback(callbackData: any): Promise<void> {
    try {
      const checkoutRequestId = callbackData.Body.stkCallback.CheckoutRequestID;
      
      // Find payment by checkout request ID
      const payment = await this.prisma.payment.findFirst({
        where: { externalId: checkoutRequestId },
      });

      if (!payment) {
        throw new HttpException('Payment not found', HttpStatus.NOT_FOUND);
      }

      // Process callback
      const result = this.mpesaService.processCallback(callbackData.Body.stkCallback);

      if (result.success) {
        const existingMetadata = payment.metadata && typeof payment.metadata === 'string' 
          ? JSON.parse(payment.metadata) 
          : {};
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'completed',
            externalId: result.transactionId,
            metadata: JSON.stringify({
              ...existingMetadata,
              mpesaReceiptNumber: result.transactionId,
              phoneNumber: result.phoneNumber,
            }),
          },
        });
      } else {
        const existingMetadata = payment.metadata && typeof payment.metadata === 'string' 
          ? JSON.parse(payment.metadata) 
          : {};
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'failed',
            metadata: JSON.stringify({
              ...existingMetadata,
              errorMessage: result.message,
            }),
          },
        });
      }
    } catch (error) {
      console.error('M-Pesa callback error:', error);
      throw error;
    }
  }

  /**
   * Handle Stripe webhook
   */
  async handleStripeWebhook(event: any): Promise<void> {
    try {
      const paymentIntent = event.data.object;

      // Find payment by payment intent ID
      const payment = await this.prisma.payment.findFirst({
        where: { externalId: paymentIntent.id },
      });

      if (!payment) {
        console.log('Payment not found for Stripe webhook:', paymentIntent.id);
        return;
      }

      let status = payment.status;
      switch (event.type) {
        case 'payment_intent.succeeded':
          status = 'completed';
          break;
        case 'payment_intent.payment_failed':
          status = 'failed';
          break;
        case 'payment_intent.canceled':
          status = 'failed';
          break;
      }

      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status },
      });
    } catch (error) {
      console.error('Stripe webhook error:', error);
      throw error;
    }
  }

  /**
   * Get payment by ID
   */
  async getPayment(id: string): Promise<any> {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        user: true,
        ride: true,
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  /**
   * Get payments by user ID
   */
  async getPaymentsByUserId(userId: string): Promise<any[]> {
    return this.prisma.payment.findMany({
      where: { userId },
      include: {
        user: true,
        ride: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get wallet balance
   */
  async getWalletBalance(userId: string) {
    return this.walletService.getWalletBalance(userId);
  }

  /**
   * Get wallet transactions
   */
  async getWalletTransactions(userId: string, limit: number = 50, offset: number = 0) {
    return this.walletService.getWalletTransactions(userId, limit, offset);
  }

  /**
   * Add money to wallet
   */
  async addToWallet(userId: string, amount: number, description: string) {
    const reference = this.generateReference();
    return this.walletService.addToWallet(userId, amount, description, reference);
  }

  /**
   * Create refund
   */
  async createRefund(paymentId: string, amount?: number, reason?: string) {
    const payment = await this.getPayment(paymentId);

    if (payment.method === 'stripe' && payment.externalId) {
      return this.stripeService.createRefund(payment.externalId, amount, reason);
    }

    if (payment.method === 'wallet') {
      // For wallet payments, add money back to wallet
      return this.walletService.addToWallet(
        payment.userId,
        amount || payment.amount,
        `Refund: ${payment.description}`,
        this.generateReference()
      );
    }

    throw new HttpException('Refund not supported for this payment method', HttpStatus.BAD_REQUEST);
  }

  /**
   * Generate unique reference
   */
  private generateReference(): string {
    return `MOTO-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }

  /**
   * Get all payments
   */
  async getAllPayments(): Promise<any[]> {
    return this.prisma.payment.findMany({
      include: {
        user: true,
        ride: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(id: string, status: string): Promise<any> {
    return this.prisma.payment.update({
      where: { id },
      data: { status: status as any },
      include: {
        user: true,
        ride: true,
      },
    });
  }
}