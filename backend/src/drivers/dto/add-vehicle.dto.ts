import { IsString, IsNumber, IsEnum, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddVehicleDto {
  @ApiProperty({ example: 'Honda' })
  @IsString()
  @IsNotEmpty()
  make: string;

  @ApiProperty({ example: 'CBR150R' })
  @IsString()
  @IsNotEmpty()
  model: string;

  @ApiProperty({ example: 2023 })
  @IsNumber()
  year: number;

  @ApiProperty({ example: 'KCA 123A' })
  @IsString()
  @IsNotEmpty()
  plateNumber: string;

  @ApiProperty({ example: 'Red' })
  @IsString()
  @IsNotEmpty()
  color: string;

  @ApiProperty({ enum: ['MOTORCYCLE', 'SCOOTER', 'BICYCLE'], example: 'MOTORCYCLE' })
  @IsEnum(['MOTORCYCLE', 'SCOOTER', 'BICYCLE'])
  type: 'MOTORCYCLE' | 'SCOOTER' | 'BICYCLE';

  @ApiProperty({ example: 'https://example.com/vehicle-image.jpg', required: false })
  @IsOptional()
  @IsString()
  image?: string;
}
