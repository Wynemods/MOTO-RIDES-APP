import { IsString, IsNotEmpty, IsOptional, IsDateString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateVehicleDto {
  @IsEnum(['motorcycle', 'car', 'lorry'])
  type: 'motorcycle' | 'car' | 'lorry';

  @IsString()
  @IsNotEmpty()
  brand: string;

  @IsString()
  @IsOptional()
  model?: string;

  @IsString()
  @IsNotEmpty()
  color: string;

  @IsString()
  @IsNotEmpty()
  numberPlate: string;

  @IsInt()
  @Min(1900)
  @Max(new Date().getFullYear() + 1)
  @IsOptional()
  year?: number;

  @IsString()
  @IsOptional()
  insuranceDocUrl?: string;
}

export class CreateDriverDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @IsString()
  @IsOptional()
  profilePictureUrl?: string;

  @IsString()
  @IsNotEmpty()
  licenseNumber: string;

  @IsDateString()
  @IsNotEmpty()
  licenseExpiry: string;

  @IsString()
  @IsOptional()
  governmentId?: string;

  @Type(() => CreateVehicleDto)
  @IsNotEmpty()
  vehicle: CreateVehicleDto;
}
