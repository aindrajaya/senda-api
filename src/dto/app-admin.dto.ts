import { IsString, IsEmail, IsNotEmpty, MinLength, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAppAdminDto {
  @ApiProperty({
    description: 'Admin first name',
    example: 'Super',
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    description: 'Admin last name',
    example: 'Admin',
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    description: 'Admin email address',
    example: 'admin@company.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Admin password',
    example: 'SecureAdminPassword123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;
}

export class UpdateAppAdminDto {
  @ApiProperty({
    description: 'Admin first name',
    example: 'Super',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  firstName?: string;

  @ApiProperty({
    description: 'Admin last name',
    example: 'Admin',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  lastName?: string;

  @ApiProperty({
    description: 'Admin email address',
    example: 'admin@company.com',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: 'Whether the admin is active',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class AppAdminResponseDto {
  @ApiProperty({
    description: 'Admin ID',
    example: 'uuid-here',
  })
  id: string;

  @ApiProperty({
    description: 'Admin first name',
    example: 'Super',
  })
  firstName: string;

  @ApiProperty({
    description: 'Admin last name',
    example: 'Admin',
  })
  lastName: string;

  @ApiProperty({
    description: 'Admin email address',
    example: 'admin@company.com',
  })
  email: string;

  @ApiProperty({
    description: 'Whether the admin is active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Date when admin was created',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Date when admin was last updated',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;
}

export class AppAdminStatsDto {
  @ApiProperty({
    description: 'Total number of companies',
    example: 150,
  })
  totalCompanies: number;

  @ApiProperty({
    description: 'Total number of users',
    example: 1250,
  })
  totalUsers: number;

  @ApiProperty({
    description: 'Total number of active users',
    example: 1100,
  })
  activeUsers: number;

  @ApiProperty({
    description: 'Total number of pending invitations',
    example: 25,
  })
  pendingInvitations: number;

  @ApiProperty({
    description: 'Total number of app admins',
    example: 3,
  })
  totalAppAdmins: number;
}

