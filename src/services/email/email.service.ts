import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private isDevelopmentMode: boolean;

  constructor(private configService: ConfigService) {
    const emailHost = this.configService.get<string>('EMAIL_HOST');
    const emailPort = this.configService.get<number>('EMAIL_PORT');
    
    // Check if we're in development mode (invalid/placeholder credentials)
    this.isDevelopmentMode = !emailHost || emailHost === 'smtp.your-email-provider.com';

    if (this.isDevelopmentMode) {
      this.logger.warn('Email Service running in DEVELOPMENT MODE - emails will be logged instead of sent');
    } else {
      this.transporter = nodemailer.createTransport({
        host: emailHost,
        port: emailPort,
        secure: emailPort === 465, // true for 465, false for other ports
        auth: {
          user: this.configService.get<string>('EMAIL_USERNAME'),
          pass: this.configService.get<string>('EMAIL_PASSWORD'),
        },
      });  
    }
  }

  async sendOtpEmail(email: string, otp: string, purpose: string): Promise<boolean> {
    if (this.isDevelopmentMode) {
      // Development mode: just log the OTP instead of sending email
      this.logger.log(`[DEVELOPMENT MODE] OTP Email for ${email}: ${otp} (Purpose: ${purpose})`);
      this.logger.log(`[DEVELOPMENT MODE] Email Subject: ${this.getSubjectByPurpose(purpose)}`);
      return true;
    }

    try {
      const subject = this.getSubjectByPurpose(purpose);
      const html = this.getOtpEmailTemplate(otp, purpose, email);

      await this.transporter.sendMail({
        from: this.configService.get<string>('EMAIL_FROM'),
        to: email,
        subject,
        html,
      });

      this.logger.log(`OTP email sent successfully to ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send OTP email to ${email}:`, error);
      return false;
    }
  }

  async sendInvitationEmail(
    email: string,
    inviterName: string,
    companyName: string,
    invitationLink: string,
  ): Promise<boolean> {
    if (this.isDevelopmentMode) {
      // Development mode: just log the invitation instead of sending email
      this.logger.log(`[DEVELOPMENT MODE] Invitation Email for ${email}`);
      this.logger.log(`[DEVELOPMENT MODE] Inviter: ${inviterName}, Company: ${companyName}`);
      this.logger.log(`[DEVELOPMENT MODE] Invitation Link: ${invitationLink}`);
      return true;
    }

    try {
      const subject = `Invitation to join ${companyName}`;
      const html = this.getInvitationEmailTemplate(
        inviterName,
        companyName,
        invitationLink,
      );

      await this.transporter.sendMail({
        from: this.configService.get<string>('EMAIL_FROM'),
        to: email,
        subject,
        html,
      });

      this.logger.log(`Invitation email sent successfully to ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send invitation email to ${email}:`, error);
      return false;
    }
  }

  private getSubjectByPurpose(purpose: string): string {
    switch (purpose) {
      case 'email_verification':
        return 'Here’s your Senda OTP';
      case 'phone_verification':
        return 'Verify Your Phone Number';
      case 'password_reset':
        return 'Reset Your Password';
      default:
        return 'Verification Code';
    }
  }

  private getPurposeText(purpose: string): string {
    switch (purpose) {
      case 'email_verification':
        return 'Your one time password to access Senda is:';
      case 'phone_verification':
        return 'Please use the following code to verify your phone number:';
      case 'password_reset':
        return 'Please use the following code to reset your password:';
      default:
        return 'Please use the following verification code:';
    }
  }

  private getOtpEmailTemplate(otp: string, purpose: string, email: string): string {
    const subjectText = this.getSubjectByPurpose(purpose);
    const purposeText = this.getPurposeText(purpose);
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${subjectText}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 24px; }
          .header { color: #007bff; font-size: 32px; font-weight: bold; text-align: left; margin-bottom: 24px; }
          .content { padding: 20px 0; background-color: #fff; }
          .otp-code { font-size: 32px; font-weight: bold; text-align: left; color: #222; margin: 24px 0 24px 0; }
          .footer { text-align: left; padding: 20px 0 0 0; color: #666; font-size: 14px; }
          .unsubscribe { color: #999; font-size: 12px; text-decoration: underline; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">${subjectText}</div>
          <div class="content">
            <p>${purposeText}</p>
            <div class="otp-code">${otp}</div>
            <p>Have a great day ahead.</p>
            <br />
            <p>Helpdesk<br/>Senda Ventures</p>
          </div>
          <div class="footer"> ` +
            // <a class="unsubscribe" href="https://senda.co/unsubscribe?email=${email}" target="_blank">Unsubscribe</a>
          `</div>
        </div>
      </body>
      </html>
    `;
  }

  private getInvitationEmailTemplate(
    inviterName: string,
    companyName: string,
    invitationLink: string,
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Team Invitation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #28a745; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .btn { display: inline-block; background-color: #28a745; color: white; 
                padding: 12px 24px; text-decoration: none; border-radius: 5px; 
                margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>You're Invited!</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p><strong>${inviterName}</strong> has invited you to join <strong>${companyName}</strong>.</p>
            <p>Click the button below to accept the invitation and create your account:</p>
            <p style="text-align: center;">
              <a href="${invitationLink}" class="btn">Accept Invitation</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background-color: #e9ecef; padding: 10px; border-radius: 3px;">
              ${invitationLink}
            </p>
            <p>This invitation will expire in 7 days.</p>
          </div>
          <div class="footer">
            <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
