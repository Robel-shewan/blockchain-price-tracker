import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alert } from '../../database/entities/alert.entity';
import { Price } from '../../database/entities/price.entity';
import { EmailService } from '../email/email.service';
import { CreateAlertDto } from './dto/create-alert.dto';

@Injectable()
export class AlertService {
  private readonly logger = new Logger(AlertService.name);

  constructor(
    @InjectRepository(Alert)
    private readonly alertRepository: Repository<Alert>,
    @InjectRepository(Price)
    private readonly priceRepository: Repository<Price>,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Create a new price alert.
   * @param createAlertDto DTO containing chain, targetPrice, and email.
   * @returns The created alert.
   */
  async createAlert(createAlertDto: CreateAlertDto): Promise<Alert> {
    const alert = this.alertRepository.create(createAlertDto);
    return this.alertRepository.save(alert);
  }

  /**
   * Checks all untriggered alerts for the specified chain and price.
   * Sends an email if any alert conditions are met.
   * Marks alerts as triggered after sending emails.
   * @param chain The blockchain chain (e.g., 'ethereum', 'polygon').
   * @param newPrice The latest price of the chain.
   */
  async checkAlertsForPrice(chain: string, newPrice: number): Promise<void> {
    this.logger.log(`Checking alerts for ${chain} with new price ${newPrice}`);

    // Fetch all untriggered alerts for the specific chain
    const alerts = await this.alertRepository.find({
      where: { chain, isTriggered: false },
    });

    for (const alert of alerts) {
      try {
        if (newPrice >= alert.targetPrice) {
          this.logger.log(
            `Alert triggered for ${alert.chain}: Current price ${newPrice} >= Target price ${alert.targetPrice}`,
          );

          // Send email notification using updated EmailService
          await this.emailService.sendPriceAlertEmail({
            type: 'target',
            chain: alert.chain,
            targetPrice: alert.targetPrice,
            currentPrice: newPrice,
            email: alert.email,
          });

          // Mark the alert as triggered
          alert.isTriggered = true;
          await this.alertRepository.save(alert);
        }
      } catch (error) {
        this.logger.error(
          `Error checking alert ID ${alert.id}: ${error.message}`,
        );
      }
    }
  }

  /**
   * Periodically checks all untriggered alerts to see if any have been triggered.
   * Sends an email if an alert condition is met.
   * Marks alerts as triggered to prevent duplicate emails.
   */
  async checkAlerts(): Promise<void> {
    this.logger.log('Checking all alerts...');

    // Fetch all untriggered alerts
    const alerts = await this.alertRepository.find({
      where: { isTriggered: false },
    });

    for (const alert of alerts) {
      try {
        const latestPrice = await this.priceRepository.findOne({
          where: { chain: alert.chain },
          order: { timestamp: 'DESC' },
        });

        if (!latestPrice) {
          this.logger.warn(`No price data found for chain: ${alert.chain}`);
          continue;
        }

        if (latestPrice.price >= alert.targetPrice) {
          this.logger.log(
            `Alert triggered for ${alert.chain}: Current price ${latestPrice.price} >= Target price ${alert.targetPrice}`,
          );

          // Send email notification using updated EmailService
          await this.emailService.sendPriceAlertEmail({
            type: 'target',
            chain: alert.chain,
            targetPrice: alert.targetPrice,
            currentPrice: latestPrice.price,
            email: alert.email,
          });

          // Mark the alert as triggered
          alert.isTriggered = true;
          await this.alertRepository.save(alert);
        }
      } catch (error) {
        this.logger.error(
          `Error checking alert ID ${alert.id}: ${error.message}`,
        );
      }
    }
  }
}
