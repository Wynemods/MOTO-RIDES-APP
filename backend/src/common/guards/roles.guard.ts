import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

export type UserRole = 'rider' | 'driver';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Check if user's active role matches required roles
    const hasActiveRole = requiredRoles.some((role) => user.activeRole === role);
    
    if (!hasActiveRole) {
      throw new ForbiddenException(
        `Access denied. You are currently in ${user.activeRole} mode. Required: ${requiredRoles.join(' or ')} mode`
      );
    }

    // If trying to access driver services, check driver verification
    if (requiredRoles.includes('driver') && user.activeRole === 'driver') {
      if (!user.driverVerified) {
        throw new ForbiddenException(
          'Access denied. Driver verification is required to access driver services. Please complete your driver verification first.'
        );
      }
    }

    return true;
  }
}
