import { IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateDriverLocationDto {
  @ApiProperty({ example: -0.0236 })
  @IsNumber()
  latitude: number;

  @ApiProperty({ example: 37.9062 })
  @IsNumber()
  longitude: number;

  @ApiProperty({ example: 45.5, required: false })
  @IsOptional()
  @IsNumber()
  heading?: number;

  @ApiProperty({ example: 25.0, required: false })
  @IsOptional()
  @IsNumber()
  speed?: number;
}
