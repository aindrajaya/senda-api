import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User, Company, Invitation } from '../entities';
import { ServicesModule } from '../services/services.module';
import { TeamService } from './team.service';
import { TeamController } from './team.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Company, Invitation]),
    ServicesModule,
  ],
  controllers: [TeamController],
  providers: [TeamService],
  exports: [TeamService],
})
export class TeamModule {}

