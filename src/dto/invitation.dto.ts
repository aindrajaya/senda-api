import { IsEmail, IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { InvitationStatus } from '../common/enums';

export class SendInvitationDto {
  @ApiProperty({
    description: 'Email address of the person to invite',
    example: 'newmember@example.com',
  })
  @IsEmail()
  email: string;
}

export class InvitationResponseDto {
  @ApiProperty({
    description: 'Success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'Invitation sent successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Invitation ID',
    example: 'uuid-here',
    required: false,
  })
  @IsOptional()
  invitationId?: string;
}

export class InvitationDetailsDto {
  @ApiProperty({
    description: 'Invitation ID',
    example: 'uuid-here',
  })
  id: string;

  @ApiProperty({
    description: 'Email address of the invitee',
    example: 'newmember@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Invitation token',
    example: 'uuid-token-here',
  })
  token: string;

  @ApiProperty({
    description: 'Invitation status',
    enum: InvitationStatus,
    example: InvitationStatus.PENDING,
  })
  status: InvitationStatus;

  @ApiProperty({
    description: 'Invitation expiry date',
    example: '2024-01-01T00:00:00.000Z',
  })
  expiresAt: Date;

  @ApiProperty({
    description: 'Date when invitation was accepted',
    example: '2024-01-01T00:00:00.000Z',
    required: false,
  })
  @IsOptional()
  acceptedAt?: Date;

  @ApiProperty({
    description: 'Name of the person who sent the invitation',
    example: 'John Doe',
  })
  invitedByName: string;

  @ApiProperty({
    description: 'Company name',
    example: 'Tech Solutions Ltd',
  })
  companyName: string;

  @ApiProperty({
    description: 'Date when invitation was created',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;
}

export class ValidateInvitationDto {
  @ApiProperty({
    description: 'Invitation token to validate',
    example: 'uuid-token-here',
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class ValidateInvitationResponseDto {
  @ApiProperty({
    description: 'Whether the invitation is valid',
    example: true,
  })
  valid: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'Invitation is valid',
  })
  message: string;

  @ApiProperty({
    description: 'Invitation details if valid',
    type: InvitationDetailsDto,
    required: false,
  })
  @IsOptional()
  invitation?: InvitationDetailsDto;
}

export class TeamMemberDto {
  @ApiProperty({
    description: 'User ID',
    example: 'uuid-here',
  })
  id: string;

  @ApiProperty({
    description: 'Team member first name',
    example: 'Jane',
  })
  firstName: string;

  @ApiProperty({
    description: 'Team member last name',
    example: 'Smith',
  })
  lastName: string;

  @ApiProperty({
    description: 'Team member email',
    example: 'jane.smith@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Team member phone',
    example: '+1234567890',
  })
  phone: string;

  @ApiProperty({
    description: 'Team member role',
    example: 'member',
  })
  role: string;

  @ApiProperty({
    description: 'Email verification status',
    example: 'verified',
  })
  emailVerificationStatus: string;

  @ApiProperty({
    description: 'Phone verification status',
    example: 'verified',
  })
  phoneVerificationStatus: string;

  @ApiProperty({
    description: 'Whether the user is active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Date when user joined',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;
}

