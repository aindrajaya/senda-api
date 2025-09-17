import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppAdmin, User, Company, Invitation } from '../entities';
import { AppAdminService } from './app-admin.service';
import { AppAdminController } from './app-admin.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AppAdmin, User, Company, Invitation])],
  controllers: [AppAdminController],
  providers: [AppAdminService],
  exports: [AppAdminService],
})
export class AppAdminModule {}

