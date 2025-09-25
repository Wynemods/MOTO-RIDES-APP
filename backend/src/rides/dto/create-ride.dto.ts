import { IsNumber, IsString, IsEnum, IsOptional, ValidateNested, IsDecimal, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class LocationDto {
  @ApiProperty({ example: -0.0236 })
  @IsNumber()
  lat: number;

  @ApiProperty({ example: 37.9062 })
  @IsNumber()
  lng: number;

  @ApiProperty({ example: 'Chuka University Main Gate' })
  @IsString()
  address: string;
}

export enum RideType {
  BIKE = 'bike',
  CAR = 'car',
  PREMIUM = 'premium',
}

export enum PaymentMethod {
  CASH = 'cash',
  WALLET = 'wallet',
  MPESA = 'mpesa',
  CARD = 'card',
}

export class CreateRideDto {
  @ApiProperty({ type: LocationDto, description: 'Pickup location' })
  @ValidateNested()
  @Type(() => LocationDto)
  pickup: LocationDto;

  @ApiProperty({ type: LocationDto, description: 'Destination location' })
  @ValidateNested()
  @Type(() => LocationDto)
  destination: LocationDto;

  @ApiProperty({ 
    enum: RideType, 
    example: RideType.BIKE,
    description: 'Type of ride (bike, car, premium)'
  })
  @IsEnum(RideType)
  rideType: RideType;

  @ApiProperty({ 
    enum: PaymentMethod, 
    example: PaymentMethod.CASH,
    description: 'Payment method'
  })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({ 
    example: 600, 
    description: 'Estimated fare in KSH (calculated by system)',
    required: false 
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedFare?: number;

  @ApiProperty({ 
    example: 'Please pick me up at the main gate', 
    required: false,
    description: 'Special instructions for the driver'
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
