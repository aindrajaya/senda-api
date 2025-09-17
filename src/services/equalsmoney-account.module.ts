import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EqualsMoneyAccountService } from './equalsmoney-account.service';
import { EqualsMoneyAccount } from '../entities/equalsmoney-account.entity';
import { User } from '../entities/user.entity';
import { Company } from '../entities/company.entity';
import { ServicesModule } from './services.module';
import { EqualsMoneyModule } from './eqm/equalsmoney.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([EqualsMoneyAccount, User, Company]),
    ServicesModule,
    EqualsMoneyModule,
  ],
  providers: [EqualsMoneyAccountService],
  exports: [EqualsMoneyAccountService],
})
export class EqualsMoneyAccountModule {}
