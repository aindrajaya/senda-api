import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private twilioClient: Twilio;
  private isDevelopmentMode: boolean;

  constructor(private configService: ConfigService) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    
    // Check if we're in development mode (invalid/placeholder credentials)
    this.isDevelopmentMode = !accountSid || !authToken || 
                           accountSid.includes('YOUR_TWILIO') || 
                           authToken.includes('YOUR_TWILIO') ||
                           accountSid === 'your-twilio-account-sid' || 
                           authToken === 'your-twilio-auth-token' ||
                           process.env.NODE_ENV === 'development';
    
    if (this.isDevelopmentMode) {
      this.logger.warn('SMS Service running in DEVELOPMENT MODE - SMS messages will be logged instead of sent');
    } else if (accountSid && authToken) {
      try {
        this.twilioClient = new Twilio(accountSid, authToken);
        this.logger.log('Twilio SMS service initialized successfully');
      } catch (error) {
        this.logger.error('Failed to initialize Twilio client:', error);
        // If initialization fails, fall back to development mode
        this.isDevelopmentMode = true;
        this.logger.warn('Falling back to SMS DEVELOPMENT MODE due to initialization error');
      }
    } else {
      this.logger.warn('Twilio credentials not configured. SMS service will be disabled.');
      this.isDevelopmentMode = true;
    }
  }

  async sendOtpSms(phone: string, otp: string, purpose: string): Promise<boolean> {
    if (this.isDevelopmentMode) {
      // Development mode: just log the SMS instead of sending it
      const message = this.getMessageByPurpose(otp, purpose);
      this.logger.log(`[DEVELOPMENT MODE] SMS for ${phone}: ${otp} (Purpose: ${purpose})`);
      this.logger.log(`[DEVELOPMENT MODE] SMS Message: ${message}`);
      return true;
    }

    if (!this.twilioClient) {
      this.logger.error('Twilio client not initialized. Cannot send SMS.');
      return false;
    }

    try {
      const message = this.getMessageByPurpose(otp, purpose);
      const fromNumber = this.configService.get<string>('TWILIO_PHONE_NUMBER');

      await this.twilioClient.messages.create({
        body: message,
        from: fromNumber,
        to: phone,
      });

      this.logger.log(`OTP SMS sent successfully to ${phone}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send OTP SMS to ${phone}:`, error);
      return false;
    }
  }

  private getMessageByPurpose(otp: string, purpose: string): string {
    const baseMessage = `Your verification code is: ${otp}`;
    
    switch (purpose) {
      case 'email_verification':
        return `${baseMessage}\n\nUse this code to verify your email address. Code expires in 10 minutes.`;
      case 'phone_verification':
        return `${baseMessage}\n\nUse this code to verify your phone number. Code expires in 10 minutes.`;
      case 'password_reset':
        return `${baseMessage}\n\nUse this code to reset your password. Code expires in 10 minutes.`;
      default:
        return `${baseMessage}\n\nCode expires in 10 minutes.`;
    }
  }

  async isConfigured(): Promise<boolean> {
    // In development mode, we're always "configured" (we just log instead of sending)
    return this.isDevelopmentMode || !!this.twilioClient;
  }
}

