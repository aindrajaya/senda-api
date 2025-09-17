import {
  IsString,
  IsEmail,
  IsPhoneNumber,
  IsArray,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../common/enums';

export class RegisterCompanyDto {
  @ApiProperty({
    description: 'Company registration number',
    example: 'REG123456789',
  })
  @IsString()
  @IsNotEmpty()
  companyNumber: string;

  @ApiProperty({
    description: 'Company name',
    example: 'Tech Solutions Ltd',
  })
  @IsString()
  @IsNotEmpty()
  companyName: string;

  @ApiProperty({
    description: 'Company address',
    example: '123 Business Street, City, Country',
  })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({
    description: 'List of company directors',
    example: ['John Doe', 'Jane Smith'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  directors: string[];

  @ApiProperty({
    description: 'CEO/Admin first name',
    example: 'John',
  })
  @IsString()
  @IsNotEmpty()
  adminFirstName: string;

  @ApiProperty({
    description: 'CEO/Admin last name',
    example: 'Doe',
  })
  @IsString()
  @IsNotEmpty()
  adminLastName: string;

  @ApiProperty({
    description: 'CEO/Admin email address',
    example: 'john.doe@techsolutions.com',
  })
  @IsEmail()
  adminEmail: string;

  @ApiProperty({
    description: 'CEO/Admin phone number',
    example: '+1234567890',
  })
  @IsPhoneNumber()
  adminPhone: string;

  @ApiProperty({
    description: 'CEO/Admin password',
    example: 'SecurePassword123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  adminPassword: string;
}

export class LoginDto {
  @ApiProperty({
    description: 'Email address',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Password',
    example: 'password123',
  })
  @IsString()
  @IsNotEmpty()
  password: string;

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

export class RegisterTeamMemberDto {
  @ApiProperty({
    description: 'Team member first name',
    example: 'Jane',
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    description: 'Team member last name',
    example: 'Smith',
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    description: 'Team member email address',
    example: 'jane.smith@techsolutions.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Team member phone number',
    example: '+1234567891',
  })
  @IsPhoneNumber()
  phone: string;

  @ApiProperty({
    description: 'Team member password',
    example: 'SecurePassword123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;

  @ApiProperty({
    description: 'Invitation token',
    example: 'uuid-token-here',
  })
  @IsString()
  @IsNotEmpty()
  invitationToken: string;
}

export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token: string;

  @ApiProperty({
    description: 'User information',
  })
  user: {
    id: string;
    email: string;
    role?: UserRole;
    userType: 'user' | 'admin';
    companyId?: string;
  };
}

export class RegistrationResponseDto {
  @ApiProperty({
    description: 'Success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'Company registered successfully. Please verify your email and phone.',
  })
  message: string;

  @ApiProperty({
    description: 'User ID for verification',
    example: 'uuid-here',
  })
  userId: string;

  @ApiProperty({
    description: 'Company ID',
    example: 'uuid-here',
  })
  companyId: string;
}

