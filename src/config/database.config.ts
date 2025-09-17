import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Company, User, AppAdmin, Otp, Invitation, EqualsMoneyAccount } from '../entities';

export const getDatabaseConfig = (configService: ConfigService): TypeOrmModuleOptions => ({
  type: 'mysql',
  host: configService.get<string>('DB_HOST', 'localhost'),
  port: configService.get<number>('DB_PORT', 3306),
  username: configService.get<string>('DB_USERNAME', 'root'),
  password: configService.get<string>('DB_PASSWORD', 'password'),
  database: configService.get<string>('DB_DATABASE', 'company_management'),
  entities: [Company, User, AppAdmin, Otp, Invitation, EqualsMoneyAccount],
  synchronize: true, // Set to false in production
  logging: process.env.NODE_ENV === 'development',
  timezone: 'Z',
});

