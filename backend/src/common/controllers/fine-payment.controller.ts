import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CancellationFineService } from '../services/cancellation-fine.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

export class PayFineDto {
  paymentMethod: 'cash' | 'mpesa' | 'card' | 'wallet';
  paymentData?: any;
}

@ApiTags('Fine Payments')
@Controller('fine-payments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FinePaymentController {
  constructor(private readonly cancellationFineService: CancellationFineService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get user fine status' })
  @ApiResponse({ status: 200, description: 'Fine status retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getFineStatus(@Request() req) {
    return this.cancellationFineService.getFineStatus(req.user.id);
  }

  @Post('pay')
  @ApiOperation({ summary: 'Pay cancellation fine' })
  @ApiResponse({ status: 200, description: 'Fine paid successfully' })
  @ApiResponse({ status: 400, description: 'Invalid payment data' })
  @ApiResponse({ status: 404, description: 'No active fine found' })
  async payFine(@Request() req, @Body() payFineDto: PayFineDto) {
    return this.cancellationFineService.payFine(
      req.user.id,
      payFineDto.paymentMethod,
      payFineDto.paymentData
    );
  }

  @Get('cancellation-eligibility')
  @ApiOperation({ summary: 'Check cancellation eligibility' })
  @ApiResponse({ status: 200, description: 'Eligibility checked successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async checkCancellationEligibility(@Request() req) {
    return this.cancellationFineService.checkCancellationEligibility(req.user.id);
  }
}
