import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class UpdateDriverProfileDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsString()
  @IsOptional()
  profilePictureUrl?: string;
}
