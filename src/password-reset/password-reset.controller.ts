import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { PasswordResetService } from './password-reset.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/interfaces/jwt-payload.interface';
import {
  ForgotPasswordDto,
  ResetPasswordDto,
  PasswordResetResponseDto,
  ChangePasswordDto,
} from '../dto/password-reset.dto';

@ApiTags('Password Reset')
@Controller('password')
@UseGuards(ThrottlerGuard)
export class PasswordResetController {
  constructor(private passwordResetService: PasswordResetService) {}

  @Post('forgot')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset OTP' })
  @ApiResponse({
    status: 200,
    description: 'Password reset request processed',
    type: PasswordResetResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ): Promise<PasswordResetResponseDto> {
    return this.passwordResetService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using OTP' })
  @ApiResponse({
    status: 200,
    description: 'Password reset result',
    type: PasswordResetResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<PasswordResetResponseDto> {
    return this.passwordResetService.resetPassword(resetPasswordDto);
  }

  @Post('change')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change password (authenticated users)' })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
    type: PasswordResetResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<PasswordResetResponseDto> {
    return this.passwordResetService.changePassword(
      user.id,
      user.userType,
      changePasswordDto,
    );
  }
}

