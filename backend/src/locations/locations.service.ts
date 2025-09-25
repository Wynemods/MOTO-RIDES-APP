import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class LocationsService {
  constructor(
    private prisma: PrismaService,
  ) {}

  async create(locationData: any): Promise<any> {
    return this.prisma.location.create({
      data: locationData,
    });
  }

  async findByUserId(userId: string): Promise<any[]> {
    return this.prisma.location.findMany({
      where: { userId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, updateData: any): Promise<any> {
    const location = await this.prisma.location.findUnique({ where: { id } });
    if (!location) {
      throw new NotFoundException('Location not found');
    }
    return this.prisma.location.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.location.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
