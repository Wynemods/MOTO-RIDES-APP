import { IsString, IsNumber, IsEnum, IsOptional, IsNotEmpty, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum LocationType {
  HOME = 'home',
  WORK = 'work',
  FAVORITE = 'favorite',
  RECENT = 'recent',
}

export class CreateLocationDto {
  @ApiProperty({ example: 'Chuka University Main Gate' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Chuka University, Tharaka Nithi County' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ example: -0.0236, description: 'Latitude coordinate' })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ example: 37.9062, description: 'Longitude coordinate' })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiProperty({ 
    enum: LocationType, 
    example: LocationType.FAVORITE,
    description: 'Type of location'
  })
  @IsEnum(LocationType)
  @IsOptional()
  type?: LocationType = LocationType.FAVORITE;
}
