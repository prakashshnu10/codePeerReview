import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';
import { delay } from '../helper/delay';
import logger from '../helper/logger';
import { EmailService } from 'src/otp/services/email.service';
import { Connection } from 'typeorm';

@Injectable()
export class WalletBalanceNotificationService {
  constructor(
    private readonly dbConnection: Connection,
    private emailService: EmailService,
  ) {}

  // @Cron(CronExpression.EVERY_2_HOURS)
  async distributesBadges(): Promise<any> {
    try {
      logger.info('distributesBadges');
      const walletBalance = await axios.get(
        `http://52.0.94.187:3009/api/moralisapis/walletBalance/${process.env.FROM_ADDRESS}`,
      );
      await delay(3000);
      const email = 'select * from a_users';
      const user = await this.dbConnection.query(email);
      if (user.length < 1) {
        throw new HttpException(
          {
            statusCode: HttpStatus.NOT_FOUND,
            message: ['No user found'],
          },
          HttpStatus.NOT_FOUND,
        );
      }
      const query = `select * from m_users where user_id ='${user[0].user_id}'`;
      const adminEmail = await this.dbConnection.query(query);
      if (adminEmail.length < 1) {
        throw new HttpException(
          {
            statusCode: HttpStatus.NOT_FOUND,
            message: ['No email found'],
          },
          HttpStatus.NOT_FOUND,
        );
      }
      const currentWalletBalance = walletBalance.data.walletBalance;
      if (
        parseFloat(currentWalletBalance) <
        parseFloat(process.env.FIXED_WALLET_BALANCE)
      ) {
        await this.emailService.sendLowBalanceToAdmin(
          adminEmail[0].email,
          `${currentWalletBalance}`,
          `${process.env.FROM_ADDRESS}`,
          `${process.env.FIXED_WALLET_BALANCE}`,
        );
        logger.info('Email sent to Admin');
      }
    } catch (error) {
      logger.error('distributesBadges:::error', error);
      throw error;
    }
  }
}
