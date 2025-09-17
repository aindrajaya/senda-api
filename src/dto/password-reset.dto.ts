import {
  IsString,
  IsEmail,
  IsPhoneNumber,
  IsNotEmpty,
  MinLength,
  IsOptional,
  IsEnum,
  Length,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Email address or phone number for password reset',
    example: 'user@example.com',
  })
  @IsString()
  @IsNotEmpty()
  identifier: string; // Can be email or phone

  @ApiProperty({
    description: 'Method to receive OTP (email or phone)',
    example: 'email',
    enum: ['email', 'phone'],
  })
  @IsEnum(['email', 'phone'])
  method: 'email' | 'phone';

  @ApiProperty({
    description: 'User type (user or admin)',
    example: 'user',
    enum: ['user', 'admin'],
    default: 'user',
  })
  @IsOptional()
  @IsEnum(['user', 'admin'])
  userType?: 'user' | 'admin' = 'user';
}

export class ResetPasswordDto {
  @ApiProperty({
    description: '6-digit OTP code',
    example: '123456',
    minLength: 6,
    maxLength: 6,
  })
  @IsString()
  @Length(6, 6, { message: 'OTP code must be exactly 6 digits' })
  otpCode: string;

  @ApiProperty({
    description: 'Email address or phone number used for password reset',
    example: 'user@example.com',
  })
  @IsString()
  @IsNotEmpty()
  identifier: string; // Can be email or phone

  @ApiProperty({
    description: 'New password',
    example: 'NewSecurePassword123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  newPassword: string;

  @ApiProperty({
    description: 'User type (user or admin)',
    example: 'user',
    enum: ['user', 'admin'],
    default: 'user',
  })
  @IsOptional()
  @IsEnum(['user', 'admin'])
  userType?: 'user' | 'admin' = 'user';
}

export class PasswordResetResponseDto {
  @ApiProperty({
    description: 'Success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'Password reset OTP sent successfully',
  })
  message: string;
}

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Current password',
    example: 'CurrentPassword123!',
  })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({
    description: 'New password',
    example: 'NewSecurePassword123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  newPassword: string;
}

