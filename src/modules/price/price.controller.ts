import { Controller, Get, Param } from '@nestjs/common';
import { PriceService } from './price.service';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Price } from '../../database/entities/price.entity';
import { subHours, startOfHour, format } from 'date-fns';

@Controller('prices')
export class PriceController {
  constructor(
    private readonly priceService: PriceService,
    @InjectRepository(Price)
    private readonly priceRepository: Repository<Price>,
  ) {}

  @Get(':chain')
  async getHourlyPrices(@Param('chain') chain: string) {
    const twentyFourHoursAgo = subHours(new Date(), 24);

    // Step 1: Fetch all prices from the last 24 hours
    const prices = await this.priceRepository
      .createQueryBuilder('price')
      .where('price.chain = :chain', { chain })
      .andWhere('price.timestamp > :twentyFourHoursAgo', { twentyFourHoursAgo })
      .orderBy('price.timestamp', 'DESC')
      .getMany();

    // Step 2: Group by hour and take the latest price for each hour
    const hourlyPrices = [];
    const seenHours = new Set();

    for (const price of prices) {
      const hour = startOfHour(price.timestamp).toISOString();

      // Only add the first price encountered for each hour (latest due to DESC order)
      if (!seenHours.has(hour)) {
        hourlyPrices.push({
          ...price,
          hour: format(startOfHour(price.timestamp), 'yyyy-MM-dd HH:mm'), // Add the formatted hour
        });
        seenHours.add(hour);
      }

      // Limit to 24 hourly prices
      if (hourlyPrices.length >= 24) break;
    }

    return hourlyPrices;
  }
}
