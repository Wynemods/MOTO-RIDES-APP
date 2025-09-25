import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
  ) {}

  async findAll(): Promise<any[]> {
    return this.prisma.user.findMany({
      select: {
        id: true,
        phone: true,
        email: true,
        name: true,
        roles: true,
        userType: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async findOne(id: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        phone: true,
        email: true,
        name: true,
        roles: true,
        userType: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(id: string, updateData: any): Promise<any> {
    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
    });
    return user;
  }

  async deactivate(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async activate(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { isActive: true },
    });
  }

  async updateWalletBalance(id: string, amount: number): Promise<any> {
    // Note: walletBalance field doesn't exist in Prisma schema
    // This should be handled by the wallet service instead
    throw new Error('Wallet balance updates should be handled by the wallet service');
  }

  async updateRating(id: string, rating: number): Promise<any> {
    // Note: rating and totalRides fields don't exist in Prisma schema
    // This should be handled by a separate rating service
    throw new Error('Rating updates should be handled by a separate rating service');
  }
}
