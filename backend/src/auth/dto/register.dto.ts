import { IsEmail, IsString, IsEnum, IsOptional, MinLength, IsPhoneNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: '+254712345678' })
  @IsPhoneNumber('KE')
  phone: string;

  @ApiProperty({ example: 'john.doe@example.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ enum: ['STUDENT', 'STAFF', 'RESIDENT'], example: 'STUDENT' })
  @IsEnum(['STUDENT', 'STAFF', 'RESIDENT'])
  userType: 'STUDENT' | 'STAFF' | 'RESIDENT';

  @ApiProperty({ example: 'CS/2021/001', required: false })
  @IsOptional()
  @IsString()
  studentId?: string;

  @ApiProperty({ 
    enum: ['rider', 'driver', 'both'], 
    example: 'rider', 
    required: false,
    description: 'Registration type: rider, driver, or both'
  })
  @IsOptional()
  @IsEnum(['rider', 'driver', 'both'])
  registrationType?: 'rider' | 'driver' | 'both';
}
