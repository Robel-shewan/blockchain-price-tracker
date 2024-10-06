import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PriceService } from './price.service';
import { PriceController } from './price.controller';
import { Price } from '../../database/entities/price.entity';
import { EmailModule } from '../email/email.module';
import { AlertModule } from '../alert/alert.module';
import { AlertService } from '../alert/alert.service';
import { Alert } from 'src/database/entities/alert.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Price, Alert]), EmailModule, AlertModule],
  providers: [PriceService, AlertService],
  controllers: [PriceController],
})
export class PriceModule {}
