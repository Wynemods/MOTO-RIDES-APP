import { IsNumber, IsString, IsEnum, IsOptional, ValidateNested, IsArray, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class SplitFareParticipantDto {
  @ApiProperty({ example: 'user-id-123' })
  @IsString()
  riderId: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name: string;

  @ApiProperty({ example: '+254712345678' })
  @IsString()
  phone: string;

  @ApiProperty({ example: 200 })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ enum: ['mpesa', 'cash'], example: 'mpesa' })
  @IsEnum(['mpesa', 'cash'])
  paymentMethod: 'mpesa' | 'cash';
}

export class CreateSplitFareRideDto {
  @ApiProperty({ type: [SplitFareParticipantDto], description: 'List of participants' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SplitFareParticipantDto)
  participants: SplitFareParticipantDto[];

  @ApiProperty({ example: 400, description: 'Total fare amount' })
  @IsNumber()
  @Min(1)
  totalFare: number;

  @ApiProperty({ example: true, description: 'Whether to split equally' })
  @IsOptional()
  isEqualSplit?: boolean;

  @ApiProperty({ 
    example: { 'user-id-1': 200, 'user-id-2': 200 }, 
    description: 'Custom amounts for each participant (if not equal split)',
    required: false 
  })
  @IsOptional()
  customAmounts?: { [riderId: string]: number };

  @ApiProperty({ example: 'Please pick us up at the main gate' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class SplitFareConfirmationDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  confirmed: boolean;

  @ApiProperty({ example: 'Payment received in cash' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class SplitFareStatusResponse {
  @ApiProperty({ example: 'ride-id-123' })
  rideId: string;

  @ApiProperty({ example: 400 })
  totalFare: number;

  @ApiProperty({ example: 283 })
  driverEarnings: number;

  @ApiProperty({ example: 117 })
  appCommission: number;

  @ApiProperty({ example: true })
  fundsLocked: boolean;

  @ApiProperty({ example: false })
  fundsReleased: boolean;

  @ApiProperty({
    example: {
      total: 2,
      completed: 1,
      pending: 1,
      failed: 0
    }
  })
  paymentSummary: {
    total: number;
    completed: number;
    pending: number;
    failed: number;
  };

  @ApiProperty({
    example: [
      {
        riderId: 'user-1',
        riderName: 'John Doe',
        amount: 200,
        paymentMethod: 'mpesa',
        status: 'completed',
        cashConfirmed: null
      }
    ]
  })
  participants: Array<{
    riderId: string;
    riderName: string;
    amount: number;
    paymentMethod: string;
    status: string;
    cashConfirmed: boolean | null;
  }>;
}

// Import IsBoolean
import { IsBoolean } from 'class-validator';
