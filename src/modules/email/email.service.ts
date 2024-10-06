import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

interface PriceIncreaseAlert {
  type: 'percentage';
  chain: string;
  oldPrice: number;
  newPrice: number;
  percentage: string;
  email: string;
}

interface TargetPriceAlert {
  type: 'target';
  chain: string;
  targetPrice: number;
  currentPrice: number;
  email: string;
}

type AlertOptions = PriceIncreaseAlert | TargetPriceAlert;

@Injectable()
export class EmailService {
  private transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  /**
   * Sends a price alert email based on the alert type.
   * @param options Alert options containing necessary details for the email.
   */
  async sendPriceAlertEmail(options: AlertOptions) {
    let subject: string;
    let text: string;

    if (options.type === 'percentage') {
      const { chain, oldPrice, newPrice, percentage } = options;
      subject = `Price Alert: ${chain.toUpperCase()} Increased by ${percentage}%`;
      text = `Hello,

The price of ${chain.toUpperCase()} has increased by more than 3% in the last hour!

Old Price: $${oldPrice}
New Price: $${newPrice}
Percentage Increase: ${percentage}%

Best regards,
Your Price Monitoring Team`;
    } else if (options.type === 'target') {
      const { chain, targetPrice, currentPrice } = options;
      subject = `Price Alert: ${chain.toUpperCase()} Reached $${targetPrice}`;
      text = `Hello,

The price of ${chain.toUpperCase()} has reached your target price of $${targetPrice}!

Current Price: $${currentPrice}

Best regards,
Your Price Monitoring Team`;
    } else {
      const { chain } = options;
      // Fallback for unexpected alert types
      subject = `Price Alert for ${chain}`;
      text = `Hello,

There is a price alert for ${chain}.

Current Price: $${(options as any).currentPrice || 'N/A'}

Best regards,
Your Price Monitoring Team`;
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: options.email,
      subject,
      text,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(
        `Price alert email sent for ${options.chain}: ${info.response}`,
      );
    } catch (error) {
      this.logger.error(
        `Error sending email for ${options.chain}: ${error.message}`,
      );
    }
  }
}
