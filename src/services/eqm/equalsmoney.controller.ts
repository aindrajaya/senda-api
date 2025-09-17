import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { EqualsMoneyService } from './equalsmoney.service';
import { EqualsMoneyAccountService } from '../equalsmoney-account.service';
import { EqualsMoneyAccountRegistrationDto, EqualsMoneyAccountRegistrationResponseDto } from '../../dto/equalsmoney-account.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

@ApiTags('Equals Money')
@Controller('api/eqm')
export class EqualsMoneyController {
  constructor(
    private readonly equalsMoneyService: EqualsMoneyService,
    private readonly equalsMoneyAccountService: EqualsMoneyAccountService
  ) {}

  @Post('webhook')
  @ApiOperation({ summary: 'Webhook endpoint to receive events from Equals Money' })
  @ApiResponse({ status: 200, description: 'Webhook received and processed successfully' })
  async handleWebhook(@Body() payload: any): Promise<{ success: boolean; message: string }> {
    const body = payload.body || payload;
    const hasEventType = typeof body.webhookEventTypeName === 'string' && body.webhookEventTypeName.length > 0;
    const hasCorrelationId = typeof body.correlationId === 'string' && body.correlationId.length > 0;
    const hasId = typeof body.id === 'string' && body.id.length > 0;
    const eventTypeAccountActivated = body.webhookEventTypeName === 'AccountActivated';

    if (hasEventType && hasCorrelationId && hasId && eventTypeAccountActivated) {
      try {
        await this.equalsMoneyAccountService.accountActivatedWebhook(body);
      } catch (error) {
        console.error('Failed to process webhook:', error);
      }
    }
    
    console.log('Received webhook:', JSON.stringify(payload, null, 2));
    return { success: true, message: 'Webhook received' };
  }

  @Get('sync-accounts')
  @ApiOperation({ summary: 'Synchronize Equals Money account IDs' })
  @ApiResponse({ status: 200, description: 'Accounts synchronized successfully' })
  async syncAccounts() {
    await this.equalsMoneyAccountService.syncAllAccountIdByCompanyNumberAndContactPhone();
    return { success: true, message: 'Accounts synchronized successfully' };
  }

  @Get('accounts')
  @ApiOperation({ summary: 'Get all accounts from Equals Money' })
  @ApiResponse({ status: 200, description: 'Accounts retrieved successfully' })
  async getAccounts() {
    return this.equalsMoneyService.getAccounts();
  }

  @Get('currencies')
  @ApiOperation({ 
    summary: 'Get supported currencies from Equals Money (Development Mode)',
    description: 'DEVELOPMENT: Returns static currency list without any API calls, authentication, OTP, phone, or email verification required. Completely public endpoint for testing.'
  })
  @ApiQuery({ 
    name: 'accountId', 
    required: false, 
    description: 'Optional mock account ID to get currencies with sample balances (Development Mode)',
    type: String 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Static currencies retrieved successfully (No authentication required)',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Static supported currencies retrieved (Development Mode - No Auth Required)' },
        currencies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'GBP' },
              name: { type: 'string', example: 'British Pound Sterling' },
              enabled: { type: 'boolean', example: true },
              balances: {
                type: 'object',
                description: 'Mock balances (only present when accountId provided)',
                properties: {
                  available: { type: 'number', example: 1500.50 },
                  pending: { type: 'number', example: 100.00 }
                }
              }
            }
          }
        }
      }
    }
  })
  async getSupportedCurrencies(@Query('accountId') accountId?: string) {
    return this.equalsMoneyService.getSupportedCurrencies(accountId);
  }

  @Post('onboard-account')
  @ApiOperation({ summary: 'Register/onboard a new account on Equals Money' })
  @ApiResponse({ 
    status: 201, 
    description: 'Account registered successfully',
    type: EqualsMoneyAccountRegistrationResponseDto 
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'Account already exists' })
  async onboardAccount(
    @Body() registrationData: EqualsMoneyAccountRegistrationDto
  ): Promise<EqualsMoneyAccountRegistrationResponseDto> {
    return this.equalsMoneyService.onboardAccount(registrationData);
  }
}
