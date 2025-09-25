import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface WalletBalance {
  userId: string;
  balance: number;
  currency: string;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  reference: string;
  createdAt: Date;
}

@Injectable()
export class WalletService {
  constructor(
    private prisma: PrismaService,
  ) {}

  /**
   * Get user wallet balance
   */
  async getWalletBalance(userId: string): Promise<WalletBalance> {
    try {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      // Calculate balance from completed payments
      const creditPayments = await this.prisma.payment.aggregate({
        where: {
          userId,
          status: 'completed',
          type: 'wallet_topup',
        },
        _sum: {
          amount: true,
        },
      });

      const debitPayments = await this.prisma.payment.aggregate({
        where: {
          userId,
          status: 'completed',
          type: 'ride_payment',
        },
        _sum: {
          amount: true,
        },
      });

      const creditTotal = Number(creditPayments._sum.amount) || 0;
      const debitTotal = Number(debitPayments._sum.amount) || 0;
      const balance = creditTotal - debitTotal;

      return {
        userId,
        balance: Math.max(0, balance), // Ensure balance is not negative
        currency: 'KES', // Default to Kenyan Shillings
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to get wallet balance', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Add money to wallet
   */
  async addToWallet(
    userId: string,
    amount: number,
    description: string,
    reference: string
  ): Promise<WalletTransaction> {
    try {
      const savedPayment = await this.prisma.payment.create({
        data: {
          userId,
          amount,
          description,
          reference,
          type: 'wallet_topup',
          status: 'completed',
          method: 'wallet',
          currency: 'KES',
        },
      });

      return {
        id: savedPayment.id,
        userId: savedPayment.userId,
        type: 'credit' as 'credit' | 'debit',
        amount: Number(savedPayment.amount),
        description: savedPayment.description,
        reference: savedPayment.reference,
        createdAt: savedPayment.createdAt,
      };
    } catch (error) {
      throw new HttpException('Failed to add money to wallet', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Deduct money from wallet
   */
  async deductFromWallet(
    userId: string,
    amount: number,
    description: string,
    reference: string
  ): Promise<WalletTransaction> {
    try {
      // Check if user has sufficient balance
      const balance = await this.getWalletBalance(userId);
      if (balance.balance < amount) {
        throw new HttpException('Insufficient wallet balance', HttpStatus.BAD_REQUEST);
      }

      const savedPayment = await this.prisma.payment.create({
        data: {
          userId,
          amount,
          description,
          reference,
          type: 'ride_payment',
          status: 'completed',
          method: 'wallet',
          currency: 'KES',
        },
      });

      return {
        id: savedPayment.id,
        userId: savedPayment.userId,
        type: 'debit' as 'credit' | 'debit',
        amount: Number(savedPayment.amount),
        description: savedPayment.description,
        reference: savedPayment.reference,
        createdAt: savedPayment.createdAt,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to deduct money from wallet', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get wallet transaction history
   */
  async getWalletTransactions(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<WalletTransaction[]> {
    try {
      const payments = await this.prisma.payment.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });

      return payments.map(payment => ({
        id: payment.id,
        userId: payment.userId,
        type: payment.type === 'wallet_topup' ? 'credit' as 'credit' | 'debit' : 'debit' as 'credit' | 'debit',
        amount: Number(payment.amount),
        description: payment.description,
        reference: payment.reference,
        createdAt: payment.createdAt,
      }));
    } catch (error) {
      throw new HttpException('Failed to get wallet transactions', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Transfer money between users (for split payments)
   */
  async transferMoney(
    fromUserId: string,
    toUserId: string,
    amount: number,
    description: string,
    reference: string
  ): Promise<{ fromTransaction: WalletTransaction; toTransaction: WalletTransaction }> {
    try {
      // Check if sender has sufficient balance
      const balance = await this.getWalletBalance(fromUserId);
      if (balance.balance < amount) {
        throw new HttpException('Insufficient wallet balance', HttpStatus.BAD_REQUEST);
      }

      // Deduct from sender
      const fromTransaction = await this.deductFromWallet(
        fromUserId,
        amount,
        `Transfer to user: ${description}`,
        reference
      );

      // Add to receiver
      const toTransaction = await this.addToWallet(
        toUserId,
        amount,
        `Transfer from user: ${description}`,
        reference
      );

      return { fromTransaction, toTransaction };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to transfer money', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Check if user can afford a payment
   */
  async canAfford(userId: string, amount: number): Promise<boolean> {
    try {
      const balance = await this.getWalletBalance(userId);
      return balance.balance >= amount;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get wallet statistics
   */
  async getWalletStats(userId: string): Promise<{
    totalCredits: number;
    totalDebits: number;
    currentBalance: number;
    transactionCount: number;
  }> {
    try {
      const creditStats = await this.prisma.payment.aggregate({
        where: {
          userId,
          type: 'wallet_topup',
          status: 'completed',
        },
        _sum: { amount: true },
        _count: { id: true },
      });

      const debitStats = await this.prisma.payment.aggregate({
        where: {
          userId,
          type: 'ride_payment',
          status: 'completed',
        },
        _sum: { amount: true },
        _count: { id: true },
      });

      const totalCredits = Number(creditStats._sum.amount) || 0;
      const totalDebits = Number(debitStats._sum.amount) || 0;
      const currentBalance = totalCredits - totalDebits;
      const transactionCount = (creditStats._count.id || 0) + (debitStats._count.id || 0);

      return {
        totalCredits,
        totalDebits,
        currentBalance: Math.max(0, currentBalance),
        transactionCount,
      };
    } catch (error) {
      throw new HttpException('Failed to get wallet statistics', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
