import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AddressService } from './address.service';
import {
  AddressLookupDto,
  AddressLookupResponseDto,
  PostcodeValidationDto,
  PostcodeValidationResponseDto,
} from '../../dto/address.dto';

@ApiTags('Address & Postcode')
@Controller('address')
@UseGuards(ThrottlerGuard)
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @Post('lookup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Find addresses by postcode',
    description: 'Look up addresses using a UK postcode via getAddress.io API'
  })
  @ApiResponse({
    status: 200,
    description: 'Address lookup completed successfully',
    type: AddressLookupResponseDto,
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid postcode format or missing postcode' 
  })
  @ApiResponse({ 
    status: 429, 
    description: 'Rate limit exceeded' 
  })
  async lookupAddresses(@Body() lookupDto: AddressLookupDto): Promise<AddressLookupResponseDto> {
    return this.addressService.findAddressByPostcode(lookupDto.postcode);
  }

  @Get('lookup/:postcode')
  @ApiOperation({ 
    summary: 'Find addresses by postcode (GET)',
    description: 'Look up addresses using a UK postcode via URL parameter'
  })
  @ApiParam({
    name: 'postcode',
    description: 'UK postcode to search for',
    example: 'SW1A1AA',
  })
  @ApiResponse({
    status: 200,
    description: 'Address lookup completed successfully',
    type: AddressLookupResponseDto,
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid postcode format' 
  })
  async lookupAddressesByParam(@Param('postcode') postcode: string): Promise<AddressLookupResponseDto> {
    return this.addressService.findAddressByPostcode(postcode);
  }

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Validate postcode format',
    description: 'Validate UK postcode format without making external API call'
  })
  @ApiResponse({
    status: 200,
    description: 'Postcode validation completed',
    type: PostcodeValidationResponseDto,
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Missing postcode' 
  })
  async validatePostcode(@Body() validationDto: PostcodeValidationDto): Promise<PostcodeValidationResponseDto> {
    const { postcode } = validationDto;
    const isValid = this.addressService.validatePostcodeFormat(postcode);
    
    return {
      isValid,
      formattedPostcode: isValid ? this.addressService.formatPostcode(postcode) : undefined,
      message: isValid ? 'Valid UK postcode format' : 'Invalid UK postcode format',
    };
  }

  @Get('validate/:postcode')
  @ApiOperation({ 
    summary: 'Validate postcode format (GET)',
    description: 'Validate UK postcode format via URL parameter'
  })
  @ApiParam({
    name: 'postcode',
    description: 'UK postcode to validate',
    example: 'SW1A1AA',
  })
  @ApiResponse({
    status: 200,
    description: 'Postcode validation completed',
    type: PostcodeValidationResponseDto,
  })
  async validatePostcodeByParam(@Param('postcode') postcode: string): Promise<PostcodeValidationResponseDto> {
    const isValid = this.addressService.validatePostcodeFormat(postcode);
    
    return {
      isValid,
      formattedPostcode: isValid ? this.addressService.formatPostcode(postcode) : undefined,
      message: isValid ? 'Valid UK postcode format' : 'Invalid UK postcode format',
    };
  }

  @Get('format/:postcode')
  @ApiOperation({ 
    summary: 'Format postcode',
    description: 'Format a postcode to standard UK format (uppercase with proper spacing)'
  })
  @ApiParam({
    name: 'postcode',
    description: 'UK postcode to format',
    example: 'sw1a1aa',
  })
  @ApiResponse({
    status: 200,
    description: 'Postcode formatted successfully',
    schema: {
      type: 'object',
      properties: {
        original: {
          type: 'string',
          example: 'sw1a1aa',
        },
        formatted: {
          type: 'string',
          example: 'SW1A 1AA',
        },
        isValid: {
          type: 'boolean',
          example: true,
        },
      },
    },
  })
  async formatPostcode(@Param('postcode') postcode: string) {
    const formatted = this.addressService.formatPostcode(postcode);
    const isValid = this.addressService.validatePostcodeFormat(postcode);
    
    return {
      original: postcode,
      formatted,
      isValid,
    };
  }
}
