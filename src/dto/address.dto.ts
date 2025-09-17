import { IsString, IsNotEmpty, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddressLookupDto {
  @ApiProperty({
    description: 'Postcode to search for addresses',
    example: 'SW1A 1AA',
    minLength: 5,
    maxLength: 8,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(5, { message: 'Postcode must be at least 5 characters long' })
  @MaxLength(8, { message: 'Postcode must not exceed 8 characters' })
  postcode: string;
}

export class AddressDto {
  @ApiProperty({
    description: 'Full formatted address',
    example: '10 Downing Street, Westminster, London, SW1A 1AA',
  })
  formatted: string;

  @ApiProperty({
    description: 'Address broken into individual lines',
    example: ['10 Downing Street', 'Westminster', 'London', 'SW1A 1AA'],
  })
  lines: string[];

  @ApiProperty({
    description: 'Formatted postcode',
    example: 'SW1A 1AA',
  })
  postcode: string;

  @ApiProperty({
    description: 'Latitude coordinate',
    example: 51.5033,
    required: false,
  })
  @IsOptional()
  latitude?: number;

  @ApiProperty({
    description: 'Longitude coordinate',
    example: -0.1276,
    required: false,
  })
  @IsOptional()
  longitude?: number;
}

export class AddressLookupResponseDto {
  @ApiProperty({
    description: 'Whether the lookup was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Found address (single result)',
    type: AddressDto,
    example: {
      formatted: '10 Downing Street, Westminster, London, SW1A 1AA',
      lines: ['10 Downing Street', 'Westminster', 'London', 'SW1A 1AA'],
      postcode: 'SW1A 1AA',
      latitude: 51.5033,
      longitude: -0.1276,
    },
    required: false,
  })
  @IsOptional()
  address?: AddressDto;

  @ApiProperty({
    description: 'Optional message (especially for errors or when no address found)',
    example: 'Address found successfully',
    required: false,
  })
  @IsOptional()
  message?: string;
}

export class PostcodeValidationDto {
  @ApiProperty({
    description: 'Postcode to validate',
    example: 'SW1A 1AA',
  })
  @IsString()
  @IsNotEmpty()
  postcode: string;
}

export class PostcodeValidationResponseDto {
  @ApiProperty({
    description: 'Whether the postcode format is valid',
    example: true,
  })
  isValid: boolean;

  @ApiProperty({
    description: 'Formatted postcode (if valid)',
    example: 'SW1A 1AA',
    required: false,
  })
  @IsOptional()
  formattedPostcode?: string;

  @ApiProperty({
    description: 'Validation message',
    example: 'Valid UK postcode format',
  })
  message: string;
}
