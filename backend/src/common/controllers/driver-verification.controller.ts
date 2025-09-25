import { Controller, Get, Post, Body, UseGuards, Request, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { DriverVerificationService, DriverVerificationRequest } from '../services/driver-verification.service';

export class SubmitVerificationDto {
  governmentId: {
    type: 'government_id';
    fileName: string;
    fileUrl: string;
  };
  driversLicense: {
    type: 'drivers_license';
    fileName: string;
    fileUrl: string;
  };
  vehicleRegistration: {
    type: 'vehicle_registration';
    fileName: string;
    fileUrl: string;
  };
  vehicleInsurance?: {
    type: 'vehicle_insurance';
    fileName: string;
    fileUrl: string;
  };
  additionalNotes?: string;
}

export class ApproveVerificationDto {
  notes?: string;
}

export class RejectVerificationDto {
  reason: string;
  requiresResubmission?: boolean;
}

@ApiTags('Driver Verification')
@Controller('driver-verification')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DriverVerificationController {
  constructor(private readonly driverVerificationService: DriverVerificationService) {}

  @Post('submit')
  @ApiOperation({ summary: 'Submit driver verification documents' })
  @ApiResponse({ status: 201, description: 'Documents submitted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid documents or missing requirements' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async submitVerification(@Request() req, @Body() submitDto: SubmitVerificationDto) {
    return this.driverVerificationService.submitVerificationDocuments(req.user.id, submitDto);
  }

  @Get('status')
  @ApiOperation({ summary: 'Get driver verification status' })
  @ApiResponse({ status: 200, description: 'Verification status retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getVerificationStatus(@Request() req) {
    return this.driverVerificationService.getVerificationStatus(req.user.id);
  }

  @Get('can-switch')
  @ApiOperation({ summary: 'Check if user can switch to driver mode' })
  @ApiResponse({ status: 200, description: 'Switch eligibility checked' })
  async canSwitchToDriver(@Request() req) {
    const canSwitch = await this.driverVerificationService.canSwitchToDriverMode(req.user.id);
    return {
      canSwitch,
      message: canSwitch 
        ? 'You can switch to Driver Mode' 
        : 'You must complete driver verification first',
    };
  }

  // Admin endpoints
  @Get('pending')
  @ApiOperation({ summary: 'Get pending verifications (Admin only)' })
  @ApiResponse({ status: 200, description: 'Pending verifications retrieved successfully' })
  async getPendingVerifications(@Request() req) {
    // In a real app, you'd check if user is admin
    return this.driverVerificationService.getPendingVerifications();
  }

  @Post('approve/:userId')
  @ApiOperation({ summary: 'Approve driver verification (Admin only)' })
  @ApiResponse({ status: 200, description: 'Verification approved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid approval request' })
  async approveVerification(
    @Request() req,
    @Param('userId') userId: string,
    @Body() approveDto: ApproveVerificationDto
  ) {
    return this.driverVerificationService.approveDriverVerification(
      userId,
      req.user.id,
      approveDto.notes
    );
  }

  @Post('reject/:userId')
  @ApiOperation({ summary: 'Reject driver verification (Admin only)' })
  @ApiResponse({ status: 200, description: 'Verification rejected successfully' })
  @ApiResponse({ status: 400, description: 'Invalid rejection request' })
  async rejectVerification(
    @Request() req,
    @Param('userId') userId: string,
    @Body() rejectDto: RejectVerificationDto
  ) {
    return this.driverVerificationService.rejectDriverVerification(
      userId,
      req.user.id,
      rejectDto.reason,
      rejectDto.requiresResubmission
    );
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get verification statistics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getVerificationStats(@Request() req) {
    return this.driverVerificationService.getVerificationStats();
  }
}
