import { IsString, IsNotEmpty, IsEnum, IsOptional, IsUrl, IsArray, IsDateString, ValidateNested, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum AccountType {
  BUSINESS = 'business',
  PERSONAL = 'personal',
}

export enum CompanyType {
  LLC = 'llc',
  LLP = 'llp',
  PLC = 'plc',
  LTD = 'ltd',
}

export enum Market {
  UK = 'UK',
  EU = 'EU',
}

export class AddressDto {
  @ApiProperty({
    description: 'Address line 1',
    example: 'Great Building',
  })
  @IsString()
  @IsNotEmpty()
  addressLine1: string;

  @ApiProperty({
    description: 'Address line 2',
    example: 'Greater Building',
    required: false,
  })
  @IsString()
  @IsOptional()
  addressLine2?: string;

  @ApiProperty({
    description: 'Town or city',
    example: 'My Town',
  })
  @IsString()
  @IsNotEmpty()
  townCity: string;

  @ApiProperty({
    description: 'Post code',
    example: 'SE13UB',
  })
  @IsString()
  @IsNotEmpty()
  postCode: string;

  @ApiProperty({
    description: 'Country code',
    example: 'GB',
  })
  @IsString()
  @IsNotEmpty()
  countryCode: string;
}

export class ContactDto {
  @ApiProperty({
    description: 'First name',
    example: 'John',
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    description: 'Last name',
    example: 'Doe',
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    description: 'Email address',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Phone number',
    example: '+447123456789',
  })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({
    description: 'Date of birth (DD/MM/YYYY)',
    example: '19/01/1946',
  })
  @IsString()
  @IsNotEmpty()
  dob: string;

  @ApiProperty({
    description: 'Address information',
    type: AddressDto,
  })
  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;
}

export class AccountDto {
  @ApiProperty({
    description: 'Company name',
    example: 'ACME international',
  })
  @IsString()
  @IsNotEmpty()
  companyName: string;

  @ApiProperty({
    description: 'Company number',
    example: '1111111111',
  })
  @IsString()
  @IsNotEmpty()
  companyNumber: string;

  @ApiProperty({
    description: 'Incorporation date (YYYY-MM-DD)',
    example: '1980-01-30',
  })
  @IsDateString()
  @IsNotEmpty()
  incorporationDate: string;

  @ApiProperty({
    description: 'Company type',
    example: 'llp',
    enum: CompanyType,
  })
  @IsEnum(CompanyType)
  @IsNotEmpty()
  type: CompanyType;

  @ApiProperty({
    description: 'Company website',
    example: 'https://www.exampleurl.com',
    required: false,
  })
  @IsUrl()
  @IsOptional()
  website?: string;

  @ApiProperty({
    description: 'Additional onboarding details',
    example: 'Additional details about the account',
    required: false,
  })
  @IsString()
  @IsOptional()
  onboardingDetail?: string;

  @ApiProperty({
    description: 'Company address',
    type: AddressDto,
  })
  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;
}

export class KycDto {
  @ApiProperty({
    description: 'Main purpose of the account',
    example: ['Investment'],
    isArray: true,
  })
  @IsArray()
  @IsString({ each: true })
  mainPurpose: string[];

  @ApiProperty({
    description: 'Source of funds',
    example: ['salary'],
    isArray: true,
  })
  @IsArray()
  @IsString({ each: true })
  sourceOfFunds: string[];

  @ApiProperty({
    description: 'Destination of funds (country codes)',
    example: ['GB'],
    isArray: true,
  })
  @IsArray()
  @IsString({ each: true })
  destinationOfFunds: string[];

  @ApiProperty({
    description: 'Currencies required',
    example: ['GBP'],
    isArray: true,
  })
  @IsArray()
  @IsString({ each: true })
  currenciesRequired: string[];

  @ApiProperty({
    description: 'Annual volume',
    example: 'Less than £10,000',
  })
  @IsString()
  @IsNotEmpty()
  annualVolume: string;

  @ApiProperty({
    description: 'Number of payments',
    example: 'More than 20 payments',
  })
  @IsString()
  @IsNotEmpty()
  numberOfPayments: string;
}

export class EqualsMoneyAccountRegistrationDto {
  @ApiProperty({
    description: 'Market',
    example: 'UK',
    enum: Market,
  })
  @IsEnum(Market)
  @IsNotEmpty()
  market: Market;

  @ApiProperty({
    description: 'Features required',
    example: ['payments'],
    isArray: true,
  })
  @IsArray()
  @IsString({ each: true })
  features: string[];

  @ApiProperty({
    description: 'Account type',
    example: 'business',
    enum: AccountType,
  })
  @IsEnum(AccountType)
  @IsNotEmpty()
  accountType: AccountType;

  @ApiProperty({
    description: 'Contact information',
    type: ContactDto,
  })
  @ValidateNested()
  @Type(() => ContactDto)
  contact: ContactDto;

  @ApiProperty({
    description: 'Account information',
    type: AccountDto,
  })
  @ValidateNested()
  @Type(() => AccountDto)
  account: AccountDto;

  @ApiProperty({
    description: 'KYC information',
    type: KycDto,
  })
  @ValidateNested()
  @Type(() => KycDto)
  kyc: KycDto;
}

export class EqualsMoneyAccountRegistrationResponseDto {
  @ApiProperty({
    description: 'Success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'Account registered successfully',
  })
  message: string;

  @ApiProperty({
    description: 'The created account ID',
    example: 'acc_1234567890',
    required: false,
  })
  accountId?: string;

  @ApiProperty({
    description: 'Customer reference',
    example: 'cust_ref_123',
    required: false,
  })
  customerReference?: string;

  @ApiProperty({
    description: 'Account status',
    example: 'PENDING_VERIFICATION',
    required: false,
  })
  status?: string;
}
