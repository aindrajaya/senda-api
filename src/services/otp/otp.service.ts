import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Otp } from '../../entities/otp.entity';
import { OtpType } from '../../common/enums';
import { EmailService } from '../email/email.service';
import { SmsService } from '../sms/sms.service';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    @InjectRepository(Otp)
    private otpRepository: Repository<Otp>,
    private emailService: EmailService,
    private smsService: SmsService,
    private configService: ConfigService,
  ) {}

  async generateAndSendOtp(
    type: OtpType,
    email?: string,
    phone?: string,
    userId?: string,
    appAdminId?: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Generate 6-digit OTP
      const code = this.generateOtpCode();
      
      // Calculate expiry time
      const expiryMinutes = this.configService.get<number>('OTP_EXPIRY_MINUTES', 10);
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + expiryMinutes);

      // Invalidate existing OTPs of the same type for the user
      await this.invalidateExistingOtps(type, userId, appAdminId, email, phone);

      // Create new OTP record
      const otp = this.otpRepository.create({
        code,
        type,
        expiresAt,
        userId,
        appAdminId,
        email,
        phone,
      });

      await this.otpRepository.save(otp);

      // Send OTP based on type
      let sent = false;
      if (type === OtpType.EMAIL_VERIFICATION || (type === OtpType.PASSWORD_RESET && email)) {
        if (email) {
          sent = await this.emailService.sendOtpEmail(email, code, type);
        }
      } else if (type === OtpType.PHONE_VERIFICATION || (type === OtpType.PASSWORD_RESET && phone)) {
        if (phone) {
          sent = await this.smsService.sendOtpSms(phone, code, type);
        }
      }

      if (sent) {
        return { success: true, message: 'OTP sent successfully' };
      } else {
        // Remove the OTP record if sending failed
        await this.otpRepository.remove(otp);
        return { success: false, message: 'Failed to send OTP' };
      }
    } catch (error) {
      this.logger.error('Error generating and sending OTP:', error);
      return { success: false, message: 'Internal server error' };
    }
  }

  async verifyOtp(
    code: string,
    type: OtpType,
    userId?: string,
    appAdminId?: string,
    email?: string,
    phone?: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const whereCondition: any = {
        code,
        type,
        isUsed: false,
        expiresAt: LessThan(new Date()) ? undefined : LessThan(new Date()),
      };

      // Remove the LessThan condition and handle it properly
      delete whereCondition.expiresAt;

      if (userId) whereCondition.userId = userId;
      if (appAdminId) whereCondition.appAdminId = appAdminId;
      if (email) whereCondition.email = email;
      if (phone) whereCondition.phone = phone;

      const otp = await this.otpRepository.findOne({
        where: whereCondition,
      });

      if (!otp) {
        return { success: false, message: 'Invalid OTP code' };
      }

      // Check if OTP is expired
      if (otp.expiresAt < new Date()) {
        return { success: false, message: 'OTP code has expired' };
      }

      // Mark OTP as used
      otp.isUsed = true;
      otp.usedAt = new Date();
      await this.otpRepository.save(otp);

      return { success: true, message: 'OTP verified successfully' };
    } catch (error) {
      this.logger.error('Error verifying OTP:', error);
      return { success: false, message: 'Internal server error' };
    }
  }

  private generateOtpCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async invalidateExistingOtps(
    type: OtpType,
    userId?: string,
    appAdminId?: string,
    email?: string,
    phone?: string,
  ): Promise<void> {
    const whereCondition: any = {
      type,
      isUsed: false,
    };

    if (userId) whereCondition.userId = userId;
    if (appAdminId) whereCondition.appAdminId = appAdminId;
    if (email) whereCondition.email = email;
    if (phone) whereCondition.phone = phone;

    await this.otpRepository.update(whereCondition, {
      isUsed: true,
      usedAt: new Date(),
    });
  }

  // Cleanup expired OTPs every hour
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredOtps(): Promise<void> {
    try {
      const result = await this.otpRepository.delete({
        expiresAt: LessThan(new Date()),
      });

      if (result.affected && result.affected > 0) {
        this.logger.log(`Cleaned up ${result.affected} expired OTP records`);
      }
    } catch (error) {
      this.logger.error('Error cleaning up expired OTPs:', error);
    }
  }
}

