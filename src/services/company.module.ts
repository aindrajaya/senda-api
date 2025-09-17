import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { CompanyService } from './company.service';
import { CompanyController } from './company.controller';
import { Company } from '../entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([Company]),
    ConfigModule,
  ],
  providers: [CompanyService],
  controllers: [CompanyController],
  exports: [CompanyService],
})
export class CompanyModule {}
