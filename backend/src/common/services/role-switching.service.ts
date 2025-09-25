import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';

export type UserRole = 'rider' | 'driver';

@Injectable()
export class RoleSwitchingService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Get user's available roles and current active role
   */
  async getUserRoles(userId: string): Promise<{
    availableRoles: UserRole[];
    activeRole: UserRole;
    canSwitch: boolean;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        roles: true,
        activeRole: true,
        isActive: true,
        driver: {
          select: {
            id: true,
            isActive: true,
          }
        }
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!user.isActive) {
      throw new ForbiddenException('User account is inactive');
    }

    // Check if user can switch to driver role
    const canSwitchToDriver = user.roles.includes('driver') && 
      user.driver && 
      user.driver.isActive;

    return {
      availableRoles: user.roles as UserRole[],
      activeRole: user.activeRole as UserRole,
      canSwitch: canSwitchToDriver || user.roles.includes('rider'),
    };
  }

  /**
   * Switch user's active role
   */
  async switchRole(userId: string, newRole: UserRole): Promise<{
    success: boolean;
    message: string;
    activeRole: UserRole;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        roles: true,
        activeRole: true,
        isActive: true,
        driver: {
          select: {
            id: true,
            isActive: true,
          }
        }
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!user.isActive) {
      throw new ForbiddenException('User account is inactive');
    }

    // Check if user has the requested role
    if (!user.roles.includes(newRole)) {
      throw new BadRequestException(`You don't have access to ${newRole} role`);
    }

    // If switching to driver, check if driver profile is active and verified
    if (newRole === 'driver') {
      if (!user.driver || !user.driver.isActive) {
        throw new ForbiddenException('Driver profile is not active. Please complete your driver registration.');
      }
      
      // Check driver verification status
      const verificationStatus = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { driverVerified: true, driverVerificationStatus: true },
      });

      if (!verificationStatus?.driverVerified) {
        throw new ForbiddenException(
          'Driver verification is required to switch to Driver Mode. Please complete your driver verification first.'
        );
      }
    }

    // Update active role
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        activeRole: newRole,
      },
    });

    // Send notification
    await this.notificationsService.sendNotification({
      userId,
      title: 'Role Switched',
      message: `You are now in ${newRole} mode`,
      type: 'system',
      data: { 
        previousRole: user.activeRole,
        newRole,
        switchedAt: new Date(),
      },
    });

    return {
      success: true,
      message: `Successfully switched to ${newRole} mode`,
      activeRole: newRole,
    };
  }

  /**
   * Add a new role to user's available roles
   */
  async addRole(userId: string, role: UserRole): Promise<{
    success: boolean;
    message: string;
    availableRoles: UserRole[];
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        roles: true,
        isActive: true,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!user.isActive) {
      throw new ForbiddenException('User account is inactive');
    }

    // Check if user already has this role
    if (user.roles.includes(role)) {
      throw new BadRequestException(`You already have ${role} role`);
    }

    // Add the new role
    const updatedRoles = [...user.roles, role] as UserRole[];
    
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        roles: updatedRoles,
      },
    });

    // Send notification
    await this.notificationsService.sendNotification({
      userId,
      title: 'New Role Added',
      message: `You now have access to ${role} services`,
      type: 'system',
      data: { 
        newRole: role,
        availableRoles: updatedRoles,
        addedAt: new Date(),
      },
    });

    return {
      success: true,
      message: `Successfully added ${role} role`,
      availableRoles: updatedRoles,
    };
  }

  /**
   * Remove a role from user's available roles
   */
  async removeRole(userId: string, role: UserRole): Promise<{
    success: boolean;
    message: string;
    availableRoles: UserRole[];
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        roles: true,
        activeRole: true,
        isActive: true,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!user.isActive) {
      throw new ForbiddenException('User account is inactive');
    }

    // Check if user has this role
    if (!user.roles.includes(role)) {
      throw new BadRequestException(`You don't have ${role} role`);
    }

    // Check if trying to remove the active role
    if (user.activeRole === role) {
      throw new BadRequestException('Cannot remove your active role. Please switch to another role first.');
    }

    // Remove the role
    const updatedRoles = user.roles.filter(r => r !== role) as UserRole[];
    
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        roles: updatedRoles,
      },
    });

    // Send notification
    await this.notificationsService.sendNotification({
      userId,
      title: 'Role Removed',
      message: `${role} role has been removed from your account`,
      type: 'system',
      data: { 
        removedRole: role,
        availableRoles: updatedRoles,
        removedAt: new Date(),
      },
    });

    return {
      success: true,
      message: `Successfully removed ${role} role`,
      availableRoles: updatedRoles,
    };
  }

  /**
   * Check if user can access a specific role's services
   */
  async canAccessRole(userId: string, role: UserRole): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        roles: true,
        activeRole: true,
        isActive: true,
        driver: {
          select: {
            id: true,
            isActive: true,
          }
        }
      },
    });

    if (!user || !user.isActive) {
      return false;
    }

    // Check if user has the role
    if (!user.roles.includes(role)) {
      return false;
    }

    // If checking driver access, verify driver profile is active
    if (role === 'driver') {
      return !!(user.driver && user.driver.isActive);
    }

    return true;
  }

  /**
   * Get role switching statistics
   */
  async getRoleSwitchingStats(): Promise<{
    totalUsers: number;
    dualRoleUsers: number;
    riderOnlyUsers: number;
    driverOnlyUsers: number;
    activeRiders: number;
    activeDrivers: number;
  }> {
    const stats = await this.prisma.user.aggregate({
      _count: {
        id: true,
      },
      where: {
        isActive: true,
      },
    });

    const dualRoleUsers = await this.prisma.user.count({
      where: {
        isActive: true,
        roles: {
          hasEvery: ['rider', 'driver'],
        },
      },
    });

    const riderOnlyUsers = await this.prisma.user.count({
      where: {
        isActive: true,
        roles: {
          equals: ['rider'],
        },
      },
    });

    const driverOnlyUsers = await this.prisma.user.count({
      where: {
        isActive: true,
        roles: {
          equals: ['driver'],
        },
      },
    });

    const activeRiders = await this.prisma.user.count({
      where: {
        isActive: true,
        activeRole: 'rider',
      },
    });

    const activeDrivers = await this.prisma.user.count({
      where: {
        isActive: true,
        activeRole: 'driver',
      },
    });

    return {
      totalUsers: stats._count.id,
      dualRoleUsers,
      riderOnlyUsers,
      driverOnlyUsers,
      activeRiders,
      activeDrivers,
    };
  }
}
