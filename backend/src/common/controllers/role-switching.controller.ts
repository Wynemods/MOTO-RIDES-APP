import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RoleSwitchingService } from '../services/role-switching.service';

export class SwitchRoleDto {
  role: 'rider' | 'driver';
}

export class AddRoleDto {
  role: 'rider' | 'driver';
}

export class RemoveRoleDto {
  role: 'rider' | 'driver';
}

@ApiTags('Role Switching')
@Controller('role-switching')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RoleSwitchingController {
  constructor(private readonly roleSwitchingService: RoleSwitchingService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get user role status and available roles' })
  @ApiResponse({ status: 200, description: 'Role status retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getRoleStatus(@Request() req) {
    return this.roleSwitchingService.getUserRoles(req.user.id);
  }

  @Post('switch')
  @ApiOperation({ summary: 'Switch active role' })
  @ApiResponse({ status: 200, description: 'Role switched successfully' })
  @ApiResponse({ status: 400, description: 'Invalid role switch request' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async switchRole(@Request() req, @Body() switchRoleDto: SwitchRoleDto) {
    return this.roleSwitchingService.switchRole(req.user.id, switchRoleDto.role);
  }

  @Post('add-role')
  @ApiOperation({ summary: 'Add a new role to user account' })
  @ApiResponse({ status: 200, description: 'Role added successfully' })
  @ApiResponse({ status: 400, description: 'Invalid role addition request' })
  async addRole(@Request() req, @Body() addRoleDto: AddRoleDto) {
    return this.roleSwitchingService.addRole(req.user.id, addRoleDto.role);
  }

  @Post('remove-role')
  @ApiOperation({ summary: 'Remove a role from user account' })
  @ApiResponse({ status: 200, description: 'Role removed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid role removal request' })
  async removeRole(@Request() req, @Body() removeRoleDto: RemoveRoleDto) {
    return this.roleSwitchingService.removeRole(req.user.id, removeRoleDto.role);
  }

  @Get('can-access/:role')
  @ApiOperation({ summary: 'Check if user can access specific role services' })
  @ApiResponse({ status: 200, description: 'Access check completed' })
  async canAccessRole(@Request() req, @Body() body: { role: 'rider' | 'driver' }) {
    const canAccess = await this.roleSwitchingService.canAccessRole(req.user.id, body.role);
    return {
      canAccess,
      role: body.role,
      message: canAccess ? `You can access ${body.role} services` : `You cannot access ${body.role} services`,
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get role switching statistics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getRoleStats(@Request() req) {
    return this.roleSwitchingService.getRoleSwitchingStats();
  }
}
