import { IsString, IsOptional, IsNotEmpty, IsEnum, IsInt, Min, Max } from 'class-validator';

export class UpdateVehicleDto {
  @IsEnum(['motorcycle', 'car', 'lorry'])
  @IsOptional()
  type?: 'motorcycle' | 'car' | 'lorry';

  @IsString()
  @IsOptional()
  brand?: string;

  @IsString()
  @IsOptional()
  model?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsString()
  @IsOptional()
  numberPlate?: string;

  @IsInt()
  @Min(1900)
  @Max(new Date().getFullYear() + 1)
  @IsOptional()
  year?: number;

  @IsString()
  @IsOptional()
  insuranceDocUrl?: string;
}
