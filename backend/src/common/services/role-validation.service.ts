import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export type UserRole = 'rider' | 'driver';

@Injectable()
export class RoleValidationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Validate if user has the required role
   */
  async validateUserRole(userId: string, requiredRole: UserRole): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { roles: true, isActive: true },
    });

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    if (!user.isActive) {
      throw new ForbiddenException('User account is inactive');
    }

    if (!user.roles.includes(requiredRole)) {
      throw new ForbiddenException(`Access denied. Required role: ${requiredRole}`);
    }

    return true;
  }

  /**
   * Check if user can access rider services
   */
  async canAccessRiderServices(userId: string): Promise<boolean> {
    return this.validateUserRole(userId, 'rider');
  }

  /**
   * Check if user can access driver services
   */
  async canAccessDriverServices(userId: string): Promise<boolean> {
    return this.validateUserRole(userId, 'driver');
  }

  /**
   * Get user role and validate access
   */
  async getUserRole(userId: string): Promise<UserRole> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { roles: true, isActive: true },
    });

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    if (!user.isActive) {
      throw new ForbiddenException('User account is inactive');
    }

    return user.roles[0] as UserRole;
  }

  /**
   * Check if user is a driver and has driver profile
   */
  async isDriverWithProfile(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { 
        roles: true, 
        isActive: true,
        driver: {
          select: { id: true, isActive: true }
        }
      },
    });

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    if (!user.isActive) {
      throw new ForbiddenException('User account is inactive');
    }

    if (!user.roles.includes('driver')) {
      throw new ForbiddenException('Access denied. Required role: driver');
    }

    if (!user.driver) {
      throw new ForbiddenException('Driver profile not found. Please complete your driver registration.');
    }

    if (!user.driver.isActive) {
      throw new ForbiddenException('Driver profile is inactive. Please contact support.');
    }

    return true;
  }

  /**
   * Get driver ID for a user
   */
  async getDriverId(userId: string): Promise<string> {
    await this.isDriverWithProfile(userId);
    
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { driver: { select: { id: true } } },
    });

    return user?.driver?.id || '';
  }
}
