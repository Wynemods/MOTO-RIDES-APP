import { IsEnum, IsNumber, IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum PaymentMethod {
  MPESA = 'MPESA',
  STRIPE = 'STRIPE',
  WALLET = 'WALLET',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export class CreatePaymentDto {
  @ApiProperty({ description: 'User ID making the payment' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'Amount to be paid' })
  @IsNumber()
  amount: number;

  @ApiProperty({ description: 'Currency code (KES, USD, etc.)' })
  @IsString()
  currency: string;

  @ApiProperty({ description: 'Payment method', enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiProperty({ description: 'Ride ID (if payment is for a ride)' })
  @IsOptional()
  @IsUUID()
  rideId?: string;

  @ApiProperty({ description: 'Description of the payment' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Customer phone number (for M-Pesa)' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({ description: 'Customer email (for Stripe)' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ description: 'Customer name (for Stripe)' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Customer ID (for Stripe)' })
  @IsOptional()
  @IsString()
  customerId?: string;
}
