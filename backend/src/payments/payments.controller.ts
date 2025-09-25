import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePaymentDto, PaymentMethod } from './dto/create-payment.dto';
import { MpesaPaymentDto } from './dto/mpesa-payment.dto';
import { StripePaymentDto } from './dto/stripe-payment.dto';

@ApiTags('Payments')
@Controller('payments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new payment' })
  @ApiResponse({ status: 201, description: 'Payment created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid payment data' })
  async createPayment(@Body() createPaymentDto: CreatePaymentDto, @Request() req) {
    // Add user ID from JWT token
    createPaymentDto.userId = req.user.id;
    return this.paymentsService.createPayment(createPaymentDto);
  }

  @Post('mpesa')
  @ApiOperation({ summary: 'Create M-Pesa payment' })
  @ApiResponse({ status: 201, description: 'M-Pesa payment initiated successfully' })
  async createMpesaPayment(@Body() mpesaPaymentDto: MpesaPaymentDto, @Request() req) {
    const createPaymentDto: CreatePaymentDto = {
      amount: mpesaPaymentDto.amount,
      currency: 'KES',
      method: PaymentMethod.MPESA,
      description: mpesaPaymentDto.description,
      phoneNumber: mpesaPaymentDto.phoneNumber,
      userId: req.user.id,
    };
    return this.paymentsService.createPayment(createPaymentDto);
  }

  @Post('stripe')
  @ApiOperation({ summary: 'Create Stripe payment' })
  @ApiResponse({ status: 201, description: 'Stripe payment intent created successfully' })
  async createStripePayment(@Body() stripePaymentDto: StripePaymentDto, @Request() req) {
    const createPaymentDto: CreatePaymentDto = {
      amount: stripePaymentDto.amount,
      currency: stripePaymentDto.currency,
      method: PaymentMethod.STRIPE,
      description: stripePaymentDto.description,
      email: stripePaymentDto.email,
      userId: req.user.id,
    };
    return this.paymentsService.createPayment(createPaymentDto);
  }

  @Post('wallet')
  @ApiOperation({ summary: 'Create wallet payment' })
  @ApiResponse({ status: 201, description: 'Wallet payment processed successfully' })
  async createWalletPayment(
    @Body() body: { amount: number; description: string },
    @Request() req
  ) {
    const createPaymentDto: CreatePaymentDto = {
      amount: body.amount,
      currency: 'KES',
      method: PaymentMethod.WALLET,
      description: body.description,
      userId: req.user.id,
    };
    return this.paymentsService.createPayment(createPaymentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all payments for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Payments retrieved successfully' })
  async getPayments(@Request() req) {
    return this.paymentsService.getPaymentsByUserId(req.user.id);
  }

  @Get('all')
  @ApiOperation({ summary: 'Get all payments (admin only)' })
  @ApiResponse({ status: 200, description: 'All payments retrieved successfully' })
  async getAllPayments() {
    return this.paymentsService.getAllPayments();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment by ID' })
  @ApiResponse({ status: 200, description: 'Payment retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async getPayment(@Param('id') id: string) {
    return this.paymentsService.getPayment(id);
  }

  @Get('wallet/balance')
  @ApiOperation({ summary: 'Get wallet balance' })
  @ApiResponse({ status: 200, description: 'Wallet balance retrieved successfully' })
  async getWalletBalance(@Request() req) {
    return this.paymentsService.getWalletBalance(req.user.id);
  }

  @Get('wallet/transactions')
  @ApiOperation({ summary: 'Get wallet transaction history' })
  @ApiResponse({ status: 200, description: 'Wallet transactions retrieved successfully' })
  async getWalletTransactions(
    @Request() req,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number
  ) {
    return this.paymentsService.getWalletTransactions(req.user.id, limit, offset);
  }

  @Post('wallet/add')
  @ApiOperation({ summary: 'Add money to wallet' })
  @ApiResponse({ status: 201, description: 'Money added to wallet successfully' })
  async addToWallet(
    @Body() body: { amount: number; description: string },
    @Request() req
  ) {
    return this.paymentsService.addToWallet(req.user.id, body.amount, body.description);
  }

  @Post(':id/refund')
  @ApiOperation({ summary: 'Create refund for payment' })
  @ApiResponse({ status: 201, description: 'Refund created successfully' })
  async createRefund(
    @Param('id') id: string,
    @Body() body: { amount?: number; reason?: string }
  ) {
    return this.paymentsService.createRefund(id, body.amount, body.reason);
  }

  @Post('mpesa/callback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle M-Pesa callback' })
  @ApiResponse({ status: 200, description: 'M-Pesa callback processed successfully' })
  async handleMpesaCallback(@Body() callbackData: any) {
    return this.paymentsService.handleMpesaCallback(callbackData);
  }

  @Post('stripe/webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle Stripe webhook' })
  @ApiResponse({ status: 200, description: 'Stripe webhook processed successfully' })
  async handleStripeWebhook(@Body() event: any) {
    return this.paymentsService.handleStripeWebhook(event);
  }
}