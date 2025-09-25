import { IsString, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class StripePaymentDto {
  @ApiProperty({ description: 'Amount to be paid (in cents)' })
  @IsNumber()
  amount: number;

  @ApiProperty({ description: 'Currency code' })
  @IsString()
  currency: string;

  @ApiProperty({ description: 'Customer email' })
  @IsString()
  email: string;

  @ApiProperty({ description: 'Payment description' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Stripe payment method ID' })
  @IsOptional()
  @IsString()
  paymentMethodId?: string;

  @ApiProperty({ description: 'Customer ID (if existing customer)' })
  @IsOptional()
  @IsString()
  customerId?: string;
}

export class StripeWebhookDto {
  @ApiProperty({ description: 'Webhook event type' })
  type: string;

  @ApiProperty({ description: 'Webhook data' })
  data: {
    object: any;
  };
}
