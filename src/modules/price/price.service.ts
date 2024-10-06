import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { LessThanOrEqual } from 'typeorm';
import Moralis from 'moralis'; // Import Moralis SDK
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Price } from '../../database/entities/price.entity';
import { EmailService } from '../email/email.service';
import { AlertService } from '../alert/alert.service';

@Injectable()
export class PriceService {
  constructor(
    @InjectRepository(Price)
    private readonly priceRepository: Repository<Price>,
    private readonly emailService: EmailService,
    private readonly alertService: AlertService,
  ) {}

  // Initialize Moralis when the service is created
  async onModuleInit() {
    await Moralis.start({
      apiKey: process.env.MORALIS_API_KEY,
    });
  }

  // Fetch the token price using Moralis API for Ethereum and Polygon
  private async fetchTokenPrice(chain: string, address: string): Promise<any> {
    try {
      const response = await Moralis.EvmApi.token.getTokenPrice({
        chain,
        include: 'percent_change',
        address,
      });

      return response.raw;
    } catch (error) {
      console.error(`Error fetching price for chain ${chain}:`, error.message);
    }
  }

  // Fetch prices for Ethereum (chain: 0x1) and Polygon (chain: 0x89)
  @Cron('*/5 * * * *') // Every 5 minutes
  async savePricesEvery5Minutes() {
    const ethereumPrice = await this.fetchTokenPrice(
      process.env.ETHEREUM_CHAIN_ID,
      process.env.MATIC_ERC20_ETHEREUM,
    );

    const polygonPrice = await this.fetchTokenPrice(
      process.env.POLYGON_CHAIN_ID,
      process.env.MATIC_NATIVE_POLYGON,
    );

    // Check if we fetched the prices correctly and save them
    if (ethereumPrice) {
      console.log('Ethereum Price:', ethereumPrice);

      // Save Ethereum price to the database
      await this.savePriceToDatabase(
        'ethereum',
        ethereumPrice.usdPrice,
        ethereumPrice.percent_change,
      );

      // Check price increase for Ethereum and send email if needed
      await this.checkPriceIncrease('ethereum', ethereumPrice.usdPrice);

      //Check for user-defined target price alerts
      await this.alertService.checkAlertsForPrice(
        'ethereum',
        ethereumPrice.usdPrice,
      );
    }

    if (polygonPrice) {
      console.log('Polygon Price:', polygonPrice);

      // Save Polygon price to the database
      await this.savePriceToDatabase(
        'polygon',
        polygonPrice.usdPrice,
        polygonPrice.percent_change,
      );

      // Check price increase for Polygon and send email if needed
      await this.checkPriceIncrease('polygon', polygonPrice.usdPrice);

      //  Check for user-defined target price alerts
      await this.alertService.checkAlertsForPrice(
        'polygon',
        polygonPrice.usdPrice,
      );
    }
  }

  // Save the price to the database
  private async savePriceToDatabase(
    chain: string,
    price: number,
    percentChange: number,
  ) {
    await this.priceRepository.save({
      chain,
      price,
      percent_change: percentChange,
    });
  }

  // Check if the price has increased by more than 3% compared to the price from one hour ago
  private async checkPriceIncrease(chain: string, newPrice: number) {
    // Find the price from 1 hour ago
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    // Use LessThanOrEqual for date comparison
    const oldPriceEntry = await this.priceRepository.findOne({
      where: {
        chain,
        timestamp: LessThanOrEqual(oneHourAgo), // Compare using LessThanOrEqual
      },
      order: { timestamp: 'DESC' },
    });

    if (!oldPriceEntry) {
      console.log(`No price found for ${chain} from 1 hour ago.`);
      return;
    }

    const oldPrice = oldPriceEntry.price;
    const priceIncreasePercentage = ((newPrice - oldPrice) / oldPrice) * 100;

    if (priceIncreasePercentage > 3) {
      console.log(
        `${chain} price increased by ${priceIncreasePercentage.toFixed(2)}%`,
      );

      // Send email notification
      await this.emailService.sendPriceAlertEmail({
        type: 'percentage',
        email: process.env.PERCENTAGE_EMAIL_SEND_TO,
        chain,
        oldPrice,
        newPrice,
        percentage: priceIncreasePercentage.toFixed(2),
      });
    }
  }
}
