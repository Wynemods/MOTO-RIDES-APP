import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateRideStatusDto {
  @ApiProperty({ 
    enum: ['PENDING', 'ACCEPTED', 'ARRIVED', 'STARTED', 'COMPLETED', 'CANCELLED'],
    example: 'ACCEPTED'
  })
  @IsEnum(['PENDING', 'ACCEPTED', 'ARRIVED', 'STARTED', 'COMPLETED', 'CANCELLED'])
  status: string;

  @ApiProperty({ example: 'Driver is on the way', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
