// src/app.module.ts
import { Module } from '@nestjs/common';
import { PriceModule } from './modules/price/price.module';
import { AlertModule } from './modules/alert/alert.module';
import { DatabaseModule } from './database/database.module'; // Assuming database is used
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { EmailModule } from './modules/email/email.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    PriceModule,
    AlertModule,
    DatabaseModule,
    EmailModule,
  ],
})
export class AppModule {}
