import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
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
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AppAdminService } from './app-admin.service';
import { AuthAppAdmin } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/interfaces/jwt-payload.interface';
import {
  CreateAppAdminDto,
  UpdateAppAdminDto,
  AppAdminResponseDto,
  AppAdminStatsDto,
} from '../dto/app-admin.dto';

@ApiTags('App Admin Management')
@Controller('admin')
@UseGuards(ThrottlerGuard)
export class AppAdminController {
  constructor(private appAdminService: AppAdminService) {}

  @Post()
  @AuthAppAdmin()
  @ApiOperation({ 
    summary: 'Create new app admin',
    description: 'Create a new application administrator. Only existing app admins can create new ones.',
  })
  @ApiResponse({
    status: 201,
    description: 'App admin created successfully',
    type: AppAdminResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiConflictResponse({ description: 'Email address already exists' })
  @ApiForbiddenResponse({ description: 'Only app admins can create new admins' })
  async createAppAdmin(
    @Body() createDto: CreateAppAdminDto,
  ): Promise<AppAdminResponseDto> {
    return this.appAdminService.createAppAdmin(createDto);
  }

  @Get()
  @AuthAppAdmin()
  @ApiOperation({ 
    summary: 'Get all app admins',
    description: 'Retrieve a list of all application administrators.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of app admins retrieved successfully',
    type: [AppAdminResponseDto],
  })
  @ApiForbiddenResponse({ description: 'Only app admins can view admin list' })
  async getAllAppAdmins(): Promise<AppAdminResponseDto[]> {
    return this.appAdminService.getAllAppAdmins();
  }

  @Get('stats')
  @AuthAppAdmin()
  @ApiOperation({ 
    summary: 'Get system statistics',
    description: 'Retrieve comprehensive system statistics including user counts, company counts, etc.',
  })
  @ApiResponse({
    status: 200,
    description: 'System statistics retrieved successfully',
    type: AppAdminStatsDto,
  })
  @ApiForbiddenResponse({ description: 'Only app admins can view system stats' })
  async getSystemStats(): Promise<AppAdminStatsDto> {
    return this.appAdminService.getSystemStats();
  }

  @Get('companies')
  @AuthAppAdmin()
  @ApiOperation({ 
    summary: 'Get all companies',
    description: 'Retrieve a list of all registered companies with their user counts.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of companies retrieved successfully',
  })
  @ApiForbiddenResponse({ description: 'Only app admins can view companies' })
  async getAllCompanies() {
    return this.appAdminService.getAllCompanies();
  }

  @Get('users')
  @AuthAppAdmin()
  @ApiOperation({ 
    summary: 'Get all users',
    description: 'Retrieve a list of all registered users across all companies.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of users retrieved successfully',
  })
  @ApiForbiddenResponse({ description: 'Only app admins can view all users' })
  async getAllUsers() {
    return this.appAdminService.getAllUsers();
  }

  @Get('profile')
  @AuthAppAdmin()
  @ApiOperation({ 
    summary: 'Get current admin profile',
    description: 'Retrieve the profile information of the currently authenticated app admin.',
  })
  @ApiResponse({
    status: 200,
    description: 'Admin profile retrieved successfully',
    type: AppAdminResponseDto,
  })
  @ApiForbiddenResponse({ description: 'Only app admins can view admin profiles' })
  async getCurrentAdminProfile(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AppAdminResponseDto> {
    return this.appAdminService.getAppAdminById(user.id);
  }

  @Get(':id')
  @AuthAppAdmin()
  @ApiOperation({ 
    summary: 'Get app admin by ID',
    description: 'Retrieve a specific application administrator by their ID.',
  })
  @ApiParam({ name: 'id', description: 'App admin ID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'App admin retrieved successfully',
    type: AppAdminResponseDto,
  })
  @ApiNotFoundResponse({ description: 'App admin not found' })
  @ApiForbiddenResponse({ description: 'Only app admins can view admin details' })
  async getAppAdminById(@Param('id') id: string): Promise<AppAdminResponseDto> {
    return this.appAdminService.getAppAdminById(id);
  }

  @Put(':id')
  @AuthAppAdmin()
  @ApiOperation({ 
    summary: 'Update app admin',
    description: 'Update an existing application administrator\'s information.',
  })
  @ApiParam({ name: 'id', description: 'App admin ID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'App admin updated successfully',
    type: AppAdminResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiNotFoundResponse({ description: 'App admin not found' })
  @ApiConflictResponse({ description: 'Email address already exists' })
  @ApiForbiddenResponse({ description: 'Only app admins can update admin details' })
  async updateAppAdmin(
    @Param('id') id: string,
    @Body() updateDto: UpdateAppAdminDto,
  ): Promise<AppAdminResponseDto> {
    return this.appAdminService.updateAppAdmin(id, updateDto);
  }

  @Delete(':id')
  @AuthAppAdmin()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Delete app admin',
    description: 'Delete an application administrator. Use with caution as this action is irreversible.',
  })
  @ApiParam({ name: 'id', description: 'App admin ID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'App admin deleted successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'App admin deleted successfully' },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'App admin not found' })
  @ApiForbiddenResponse({ description: 'Only app admins can delete other admins' })
  async deleteAppAdmin(@Param('id') id: string) {
    return this.appAdminService.deleteAppAdmin(id);
  }

  @Get('equalsmoney/accounts')
  @AuthAppAdmin()
  @ApiOperation({ 
    summary: 'Get all EqualsMoney accounts',
    description: 'Retrieve all registered EqualsMoney accounts with user and company information',
  })
  @ApiResponse({
    status: 200,
    description: 'EqualsMoney accounts retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          status: { type: 'string' },
          equalsMoneyAccountId: { type: 'string' },
          businessLegalName: { type: 'string' },
          contactEmail: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          user: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              email: { type: 'string' },
            },
          },
        },
      },
    },
  })
  @ApiForbiddenResponse({ description: 'Only app admins can access EqualsMoney accounts' })
  async getEqualsMoneyAccounts() {
    // This will be handled by injecting the EqualsMoneyAccountService
    return { message: 'EqualsMoney accounts endpoint - to be implemented' };
  }
}

