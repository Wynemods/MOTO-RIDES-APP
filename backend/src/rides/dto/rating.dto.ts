import { IsNumber, IsString, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRatingDto {
  @ApiProperty({ 
    example: 5, 
    description: 'Rating from 1 to 5 stars',
    minimum: 1,
    maximum: 5
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ 
    example: 'Great driver, very professional!', 
    required: false,
    description: 'Optional comment about the ride'
  })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiProperty({ 
    example: 'ride-123', 
    description: 'ID of the ride being rated'
  })
  @IsString()
  rideId: string;
}

export class RatingResponse {
  @ApiProperty({ example: 'rating-123' })
  id: string;

  @ApiProperty({ example: 5 })
  rating: number;

  @ApiProperty({ example: 'Great driver, very professional!' })
  comment?: string;

  @ApiProperty({ example: 'user-123' })
  userId: string;

  @ApiProperty({ example: 'driver-456' })
  driverId: string;

  @ApiProperty({ example: 'ride-123' })
  rideId: string;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  createdAt: Date;
}
