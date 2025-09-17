import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { getDatabaseConfig } from './config/database.config';
import { AuthModule } from './auth/auth.module';
import { ServicesModule } from './services/services.module';
import { EqualsMoneyModule } from './services/eqm/equalsmoney.module';
import { CompanyModule } from './services/company.module';
import { UserModule } from './user/user.module';
import { TeamModule } from './team/team.module';
import { PasswordResetModule } from './password-reset/password-reset.module';
import { AppAdminModule } from './app-admin/app-admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getDatabaseConfig,
      inject: [ConfigService],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 10, // 10 requests per minute
      },
    ]),
    ScheduleModule.forRoot(),
    AuthModule,
    ServicesModule,
    EqualsMoneyModule,
    CompanyModule,
    UserModule,
    TeamModule,
    PasswordResetModule,
    AppAdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
