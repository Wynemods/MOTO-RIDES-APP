import { IsString, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MpesaPaymentDto {
  @ApiProperty({ description: 'Amount to be paid' })
  @IsNumber()
  amount: number;

  @ApiProperty({ description: 'Customer phone number' })
  @IsString()
  phoneNumber: string;

  @ApiProperty({ description: 'Payment description' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Account reference' })
  @IsOptional()
  @IsString()
  accountReference?: string;

  @ApiProperty({ description: 'Transaction description' })
  @IsOptional()
  @IsString()
  transactionDesc?: string;
}

export class MpesaCallbackDto {
  @ApiProperty({ description: 'M-Pesa callback data' })
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: Array<{
          Name: string;
          Value: string | number;
        }>;
      };
    };
  };
}
