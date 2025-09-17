import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { UserService } from './user.service';
import { AuthService } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LocalAuthGuard } from '../auth/guards/local-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/interfaces/jwt-payload.interface';
import {
  RegisterCompanyDto,
  RegisterTeamMemberDto,
  LoginDto,
  AuthResponseDto,
  RegistrationResponseDto,
} from '../dto/auth.dto';
import { VerifyOtpDto, OtpResponseDto } from '../dto/otp.dto';
import { EqualsMoneyAccountRegistrationDto, EqualsMoneyAccountRegistrationResponseDto } from '../dto/equalsmoney-account.dto';
import { EqualsMoneyService } from '../services/eqm/equalsmoney.service';
import { EqualsMoneyAccountService } from '../services/equalsmoney-account.service';

@ApiTags('Authentication & Registration')
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private equalsMoneyService: EqualsMoneyService,
    private equalsMoneyAccountService: EqualsMoneyAccountService,
  ) { }

  @Post('register/company')
  @ApiOperation({ summary: 'Register a new company with CEO/admin user' })
  @ApiResponse({
    status: 201,
    description: 'Company registered successfully',
    type: RegistrationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'Company or email already exists' })
  async registerCompany(
    @Body() registerDto: RegisterCompanyDto,
  ): Promise<RegistrationResponseDto> {
    return this.userService.registerCompany(registerDto);
  }

  @Post('register/team-member')
  @ApiOperation({ summary: 'Register a new team member via invitation' })
  @ApiResponse({
    status: 201,
    description: 'Team member registered successfully',
    type: RegistrationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Invalid invitation' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async registerTeamMember(
    @Body() registerDto: RegisterTeamMemberDto,
  ): Promise<RegistrationResponseDto> {
    return this.userService.registerTeamMember(registerDto);
  }

  @Post('register/account')
  @ApiOperation({ 
    summary: 'Register EqualsMoney account with user registration',
    description: 'Registers a business account with EqualsMoney API and creates a user account locally' 
  })
  @ApiResponse({
    status: 201,
    description: 'Account registered successfully',
    type: EqualsMoneyAccountRegistrationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid data' })
  @ApiResponse({ status: 409, description: 'User with email already exists' })
  async registerAccount(
    @Body() accountData: EqualsMoneyAccountRegistrationDto,
  ) {
    return this.equalsMoneyAccountService.registerAccount(accountData);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    this.logger.log(`=== LOGIN REQUEST START ===`);
    this.logger.log(`Email: ${loginDto.email}`);
    this.logger.log(`UserType: ${loginDto.userType || 'user'}`);
    
    try {
      const user = await this.authService.validateUser(
        loginDto.email,
        loginDto.password,
        'user',
      );
      
      if (!user) {
        this.logger.error(`=== LOGIN FAILED ===`);
        this.logger.error(`❌ Authentication failed for: ${loginDto.email}`);
        this.logger.error(`Reason: validateUser returned null - check AuthService logs above for details`);
        this.logger.log(`=== LOGIN REQUEST END ===`);
        throw new UnauthorizedException('Invalid credentials');
      }
      
      this.logger.log(`=== LOGIN SUCCESS ===`);
      this.logger.log(`✅ User ${loginDto.email} authenticated successfully`);
      const result = await this.authService.login(user);
      this.logger.log(`✅ JWT token generated for user: ${user.id}`);
      this.logger.log(`=== LOGIN REQUEST END ===`);
      
      return result;
    } catch (error) {
      this.logger.error(`=== LOGIN EXCEPTION ===`);
      this.logger.error(`❌ Exception during login for ${loginDto.email}:`, error.message);
      if (error.stack) {
        this.logger.error('Stack trace:', error.stack);
      }
      this.logger.log(`=== LOGIN REQUEST END ===`);
      throw error;
    }
  }

  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login app admin' })
  @ApiResponse({
    status: 200,
    description: 'Admin login successful',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async adminLogin(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    this.logger.log(`=== ADMIN LOGIN REQUEST START ===`);
    this.logger.log(`Email: ${loginDto.email}`);
    
    try {
      const admin = await this.authService.validateUser(
        loginDto.email,
        loginDto.password,
        'admin',
      );

      if (!admin) {
        this.logger.error(`=== ADMIN LOGIN FAILED ===`);
        this.logger.error(`❌ Admin authentication failed for: ${loginDto.email}`);
        this.logger.log(`=== ADMIN LOGIN REQUEST END ===`);
        throw new UnauthorizedException('Invalid credentials');
      }

      this.logger.log(`=== ADMIN LOGIN SUCCESS ===`);
      this.logger.log(`✅ Admin ${loginDto.email} authenticated successfully`);
      const result = await this.authService.login(admin);
      this.logger.log(`✅ JWT token generated for admin: ${admin.id}`);
      this.logger.log(`=== ADMIN LOGIN REQUEST END ===`);
      
      return result;
    } catch (error) {
      this.logger.error(`=== ADMIN LOGIN EXCEPTION ===`);
      this.logger.error(`❌ Exception during admin login for ${loginDto.email}:`, error.message);
      if (error.stack) {
        this.logger.error('Stack trace:', error.stack);
      }
      this.logger.log(`=== ADMIN LOGIN REQUEST END ===`);
      throw error;
    }
  }

  @Post('verify/email/:userId')
  @ApiOperation({ summary: 'Verify user email with OTP' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'Email verification result',
    type: OtpResponseDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async verifyEmail(
    @Param('userId') userId: string,
    @Body() verifyDto: VerifyOtpDto,
  ): Promise<OtpResponseDto> {
    return this.userService.verifyEmail(userId, verifyDto);
  }

  @Post('verify/phone/:userId')
  @ApiOperation({ summary: 'Verify user phone with OTP' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'Phone verification result',
    type: OtpResponseDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async verifyPhone(
    @Param('userId') userId: string,
    @Body() verifyDto: VerifyOtpDto,
  ): Promise<OtpResponseDto> {
    return this.userService.verifyPhone(userId, verifyDto);
  }

  @Post('resend-otp/:userId/:type')
  @ApiOperation({ summary: 'Resend verification OTP' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiParam({ name: 'type', description: 'OTP type', enum: ['email', 'phone'] })
  @ApiResponse({
    status: 200,
    description: 'OTP resend result',
    type: OtpResponseDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async resendOtp(
    @Param('userId') userId: string,
    @Param('type') type: 'email' | 'phone',
  ): Promise<OtpResponseDto> {
    return this.userService.resendVerificationOtp(userId, type);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@CurrentUser() user: AuthenticatedUser) {
    if (user.userType === 'admin') {
      // Handle app admin profile separately if needed
      return { message: 'App admin profile endpoint not implemented yet' };
    }
    return this.userService.getUserProfile(user.id);
  }

  @Get('check-email/:email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Check email availability',
    description: 'Check if an email address is available for registration (Public endpoint)'
  })
  @ApiParam({
    name: 'email',
    required: true,
    description: 'Email address to check for availability',
    example: 'user@example.com',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Email availability check completed',
    schema: {
      type: 'object',
      properties: {
        available: {
          type: 'boolean',
          example: false,
          description: 'Whether the email is available for registration',
        },
        message: {
          type: 'string',
          example: 'Email is already taken',
          description: 'Status message about email availability',
        },
        success: {
          type: 'boolean',
          example: true,
          description: 'Whether the check was performed successfully',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid email format',
    schema: {
      type: 'object',
      properties: {
        available: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Please provide a valid email format' },
        success: { type: 'boolean', example: false },
      },
    },
  })
  @ApiResponse({ status: 429, description: 'Too many requests - rate limited' })
  async checkEmailAvailability(
    @Param('email') email: string,
  ): Promise<{
    available: boolean;
    message: string;
    success: boolean;
  }> {
    return this.userService.checkEmailAvailability(email);
  }
}
