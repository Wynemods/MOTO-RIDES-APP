import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateDriverStatusDto {
  @ApiProperty({ 
    enum: ['OFFLINE', 'ONLINE', 'BUSY', 'AVAILABLE'],
    example: 'ONLINE'
  })
  @IsEnum(['OFFLINE', 'ONLINE', 'BUSY', 'AVAILABLE'])
  status: string;

  @ApiProperty({ example: 'Going online for the evening shift', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
