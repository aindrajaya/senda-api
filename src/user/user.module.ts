import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company, User, Invitation, EqualsMoneyAccount } from '../entities';
import { AuthModule } from '../auth/auth.module';
import { ServicesModule } from '../services/services.module';
import { EqualsMoneyModule } from '../services/eqm/equalsmoney.module';
import { EqualsMoneyAccountModule } from '../services/equalsmoney-account.module';
import { UserService } from './user.service';
import { UserController } from './user.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Company, User, Invitation, EqualsMoneyAccount]),
    AuthModule,
    ServicesModule,
    EqualsMoneyModule,
    EqualsMoneyAccountModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}

