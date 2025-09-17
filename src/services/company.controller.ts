import { Controller, Get, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { CompanyService, CompanyDataResponse } from '../services/company.service';

@ApiTags('Company Information')
@Controller('company')
@UseGuards(ThrottlerGuard)
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Get('data')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Get company data from Companies House (Public)',
    description: 'Publicly accessible endpoint to retrieve company information and director details from the UK Companies House API using the company number/business ID'
  })
  @ApiQuery({
    name: 'business_id',
    required: true,
    description: 'Company registration number (Companies House number)',
    example: '09542738',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Company data retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Company details retrieved successfully',
        },
        data: {
          type: 'object',
          description: 'Company information from Companies House',
          properties: {
            company_number: { type: 'string', example: '09542738' },
            company_name: { type: 'string', example: 'EXAMPLE COMPANY LIMITED' },
            company_status: { type: 'string', example: 'active' },
            date_of_creation: { type: 'string', example: '2015-04-15' },
            type: { type: 'string', example: 'ltd' },
            registered_office_address: {
              type: 'object',
              properties: {
                address_line_1: { type: 'string', example: '123 Example Street' },
                locality: { type: 'string', example: 'London' },
                postal_code: { type: 'string', example: 'SW1A 1AA' },
                country: { type: 'string', example: 'England' },
              },
            },
            sic_codes: {
              type: 'array',
              items: { type: 'string' },
              example: ['70229', '62020'],
            },
          },
        },
        director: {
          type: 'array',
          description: 'List of company directors/officers',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', example: 'SMITH, John' },
              officer_role: { type: 'string', example: 'director' },
              appointed_on: { type: 'string', example: '2015-04-15' },
              nationality: { type: 'string', example: 'British' },
              country_of_residence: { type: 'string', example: 'England' },
            },
          },
        },
        success: {
          type: 'boolean',
          example: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Company not found or unable to retrieve information',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Unable to retrieve information. Please try again after 30 minutes',
        },
        data: { type: 'null' },
        success: { type: 'boolean', example: false },
      },
    },
  })
  @ApiResponse({
    status: 408,
    description: 'Request timeout',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Request timed out. Please try again later.',
        },
        data: { type: 'null' },
        success: { type: 'boolean', example: false },
      },
    },
  })
  @ApiResponse({ status: 422, description: 'Validation error' })
  @ApiResponse({ status: 429, description: 'Too many requests - rate limited' })
  async getCompanyData(
    @Query('business_id') businessId: string,
  ): Promise<CompanyDataResponse> {
    return this.companyService.getCompanyData(businessId);
  }

  @Get('directors/names')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Get director names only (Public)',
    description: 'Publicly accessible endpoint to retrieve only the director names from the UK Companies House API'
  })
  @ApiQuery({
    name: 'business_id',
    required: true,
    description: 'Company registration number (Companies House number)',
    example: '09542738',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Director names retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Director names retrieved successfully',
        },
        names: {
          type: 'array',
          items: { type: 'string' },
          example: ['SMITH, John', 'DOE, Jane'],
          description: 'List of director names',
        },
        success: {
          type: 'boolean',
          example: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Company not found or no directors found',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'No directors found for this company',
        },
        names: { type: 'array', items: { type: 'string' } },
        success: { type: 'boolean', example: false },
      },
    },
  })
  @ApiResponse({ status: 422, description: 'Validation error' })
  @ApiResponse({ status: 429, description: 'Too many requests - rate limited' })
  async getDirectorNames(
    @Query('business_id') businessId: string,
  ): Promise<{ message: string; names: string[]; success: boolean }> {
    if (!businessId || typeof businessId !== 'string') {
      return {
        message: 'Business ID is required and must be a string',
        names: [],
        success: false,
      };
    }

    try {
      const names = await this.companyService.getDirectorNames(businessId);
      
      return {
        message: names.length > 0 
          ? 'Director names retrieved successfully' 
          : 'No directors found for this company',
        names,
        success: true,
      };
    } catch (error) {
      return {
        message: 'Unable to retrieve director names. Please try again later.',
        names: [],
        success: false,
      };
    }
  }
}
