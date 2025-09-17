import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User, AppAdmin } from '../entities';
import { EqualsMoneyAccount } from '../entities/equalsmoney-account.entity';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { RolesGuard } from './guards/roles.guard';
import { UserTypesGuard } from './guards/user-type.guard';
import { CompanyOwnershipGuard } from './guards/company-ownership.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, AppAdmin, EqualsMoneyAccount]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '7d'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    AuthService,
    JwtStrategy,
    LocalStrategy,
    RolesGuard,
    UserTypesGuard,
    CompanyOwnershipGuard,
  ],
  exports: [
    AuthService,
    JwtModule,
    RolesGuard,
    UserTypesGuard,
    CompanyOwnershipGuard,
  ],
})
export class AuthModule {}

