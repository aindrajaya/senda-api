import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, AppAdmin } from '../entities';
import { OtpType } from '../common/enums';
import { PasswordUtil } from '../common/utils/password.util';
import { OtpService } from '../services/otp/otp.service';
import {
  ForgotPasswordDto,
  ResetPasswordDto,
  PasswordResetResponseDto,
  ChangePasswordDto,
} from '../dto/password-reset.dto';

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(AppAdmin)
    private appAdminRepository: Repository<AppAdmin>,
    private otpService: OtpService,
  ) {}

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<PasswordResetResponseDto> {
    const { identifier, method, userType } = forgotPasswordDto;

    try {
      let user: User | AppAdmin | null = null;
      let email: string | undefined;
      let phone: string | undefined;

      if (userType === 'admin') {
        // For app admins, identifier should be email
        user = await this.appAdminRepository.findOne({
          where: { email: identifier, isActive: true },
        });
        email = identifier;
      } else {
        // For regular users, identifier can be email or phone
        if (this.isEmail(identifier)) {
          user = await this.userRepository.findOne({
            where: { email: identifier, isActive: true },
          });
          email = identifier;
        } else if (this.isPhoneNumber(identifier)) {
          user = await this.userRepository.findOne({
            where: { phone: identifier, isActive: true },
          });
          phone = identifier;
        } else {
          return {
            success: false,
            message: 'Invalid email or phone number format',
          };
        }
      }

      if (!user) {
        // Don't reveal if user exists or not for security
        return {
          success: true,
          message: 'If the account exists, a password reset code has been sent.',
        };
      }

      // Determine which contact method to use
      if (method === 'email') {
        if (userType === 'admin') {
          email = (user as AppAdmin).email;
        } else {
          email = (user as User).email;
        }
      } else if (method === 'phone') {
        if (userType === 'admin') {
          return {
            success: false,
            message: 'Phone reset not available for admin accounts',
          };
        }
        phone = (user as User).phone;
      }

      // Send OTP
      const result = await this.otpService.generateAndSendOtp(
        OtpType.PASSWORD_RESET,
        email,
        phone,
        userType === 'user' ? user.id : undefined,
        userType === 'admin' ? user.id : undefined,
      );

      if (result.success) {
        return {
          success: true,
          message: 'Password reset code sent successfully.',
        };
      } else {
        return {
          success: false,
          message: 'Failed to send password reset code. Please try again.',
        };
      }
    } catch (error) {
      this.logger.error('Error in forgot password:', error);
      return {
        success: false,
        message: 'An error occurred. Please try again later.',
      };
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<PasswordResetResponseDto> {
    const { otpCode, identifier, newPassword, userType } = resetPasswordDto;

    try {
      let user: User | AppAdmin | null = null;
      let email: string | undefined;
      let phone: string | undefined;

      if (userType === 'admin') {
        user = await this.appAdminRepository.findOne({
          where: { email: identifier, isActive: true },
        });
        email = identifier;
      } else {
        if (this.isEmail(identifier)) {
          user = await this.userRepository.findOne({
            where: { email: identifier, isActive: true },
          });
          email = identifier;
        } else if (this.isPhoneNumber(identifier)) {
          user = await this.userRepository.findOne({
            where: { phone: identifier, isActive: true },
          });
          phone = identifier;
        } else {
          return {
            success: false,
            message: 'Invalid email or phone number format',
          };
        }
      }

      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      // Verify OTP
      const otpResult = await this.otpService.verifyOtp(
        otpCode,
        OtpType.PASSWORD_RESET,
        userType === 'user' ? user.id : undefined,
        userType === 'admin' ? user.id : undefined,
        email,
        phone,
      );

      if (!otpResult.success) {
        return {
          success: false,
          message: otpResult.message,
        };
      }

      // Hash new password
      const hashedPassword = await PasswordUtil.hash(newPassword);

      // Update password
      user.password = hashedPassword;
      
      if (userType === 'admin') {
        await this.appAdminRepository.save(user as AppAdmin);
      } else {
        await this.userRepository.save(user as User);
      }

      return {
        success: true,
        message: 'Password reset successfully',
      };
    } catch (error) {
      this.logger.error('Error in reset password:', error);
      return {
        success: false,
        message: 'An error occurred. Please try again later.',
      };
    }
  }

  async changePassword(
    userId: string,
    userType: 'user' | 'admin',
    changePasswordDto: ChangePasswordDto,
  ): Promise<PasswordResetResponseDto> {
    const { currentPassword, newPassword } = changePasswordDto;

    try {
      let user: User | AppAdmin | null = null;

      if (userType === 'admin') {
        user = await this.appAdminRepository.findOne({
          where: { id: userId, isActive: true },
        });
      } else {
        user = await this.userRepository.findOne({
          where: { id: userId, isActive: true },
        });
      }

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await PasswordUtil.compare(
        currentPassword,
        user.password,
      );

      if (!isCurrentPasswordValid) {
        throw new UnauthorizedException('Current password is incorrect');
      }

      // Hash new password
      const hashedPassword = await PasswordUtil.hash(newPassword);

      // Update password
      user.password = hashedPassword;
      
      if (userType === 'admin') {
        await this.appAdminRepository.save(user as AppAdmin);
      } else {
        await this.userRepository.save(user as User);
      }

      return {
        success: true,
        message: 'Password changed successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof UnauthorizedException) {
        throw error;
      }
      
      this.logger.error('Error in change password:', error);
      throw new BadRequestException('An error occurred. Please try again later.');
    }
  }

  private isEmail(identifier: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(identifier);
  }

  private isPhoneNumber(identifier: string): boolean {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(identifier);
  }
}

