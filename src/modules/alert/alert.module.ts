import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Alert } from '../../database/entities/alert.entity';
import { AlertService } from './alert.service';
import { AlertController } from './alert.controller';
import { Price } from '../../database/entities/price.entity';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [TypeOrmModule.forFeature([Alert, Price]), EmailModule],
  providers: [AlertService],
  controllers: [AlertController],
})
export class AlertModule {}
