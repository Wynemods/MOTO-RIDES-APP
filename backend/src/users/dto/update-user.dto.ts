import { IsEmail, IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserType } from '../enums/user.enums';

export class UpdateUserDto {
  @ApiProperty({ example: 'john.doe@example.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'John', required: false })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ example: 'Doe', required: false })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ enum: UserType, example: UserType.STUDENT, required: false })
  @IsOptional()
  @IsEnum(UserType)
  userType?: UserType;

  @ApiProperty({ example: 'CS/2021/001', required: false })
  @IsOptional()
  @IsString()
  studentId?: string;

  @ApiProperty({ example: 'profile-image-url', required: false })
  @IsOptional()
  @IsString()
  profileImage?: string;
}
