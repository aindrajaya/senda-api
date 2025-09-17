import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AddressService } from './address.service';
import { AddressController } from './address.controller';

@Module({
  imports: [ConfigModule],
  controllers: [AddressController],
  providers: [AddressService],
  exports: [AddressService],
})
export class AddressModule {}
