import { Module } from '@nestjs/common';
import { EqualsMoneyService } from './equalsmoney.service';
import { EqualsMoneyController } from './equalsmoney.controller';
import { EqualsMoneyAccountService } from '../equalsmoney-account.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EqualsMoneyAccount } from '../../entities/equalsmoney-account.entity';
import { User } from '../../entities/user.entity';
import { Company } from '../../entities/company.entity';
import { ServicesModule } from '../services.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([EqualsMoneyAccount, User, Company]),
    ServicesModule,
  ],
  providers: [EqualsMoneyService, EqualsMoneyAccountService],
  controllers: [EqualsMoneyController],
  exports: [EqualsMoneyService, EqualsMoneyAccountService],
})
export class EqualsMoneyModule {}
