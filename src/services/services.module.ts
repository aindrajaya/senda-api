import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Otp } from '../entities/otp.entity';
import { EmailService } from './email/email.service';
import { SmsService } from './sms/sms.service';
import { OtpService } from './otp/otp.service';
import { AddressModule } from './address/address.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Otp]),
    AddressModule,
  ],
  providers: [EmailService, SmsService, OtpService],
  exports: [EmailService, SmsService, OtpService, AddressModule],
})
export class ServicesModule {}

