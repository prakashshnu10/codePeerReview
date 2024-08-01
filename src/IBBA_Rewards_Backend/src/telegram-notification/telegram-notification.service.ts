import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import axios from 'axios';
import logger from '../helper/logger';

@Injectable()
export class TelegramNotificationService {
  private readonly botToken = process.env.TELEGRAM_BOT_TOKEN;
  private readonly chatId = process.env.TELEGRAM_CHAT_ID; // The chat ID where you want to send notifications.

  async sendNotification(message: string): Promise<any> {
    logger.info(`sendNotification function initiated---`);
    logger.info(`Bot token is: ${this.botToken}`);
    logger.info(`Chat Id is: ${this.chatId}`);
    const telegramUri = process.env.TELEGRAM_URI;
    logger.info(`URI for telegram notification: ${telegramUri}`);
    const telegramService = process.env.TELEGRAM_SERVICE;
    logger.info(`Service which we are using from telegram: ${telegramService}`);
    const telegramRequestMethod = process.env.TELEGRAM_METHOD;
    logger.info(
      `Request method to call telegram API: ${telegramRequestMethod}`,
    );
    const apiUrl = `${telegramUri}${this.botToken}${telegramService}`;

    const params = new URLSearchParams({
      chat_id: this.chatId,
      text: message,
    });

    try {
      const response = await fetch(apiUrl, {
        method: `${telegramRequestMethod}`,
        body: params,
      });

      if (response.status == 200) {
        console.log(response);
        console.log(response.status);
        logger.info(`Response coming from telegram: ${response}`);
        return {
          Status: `Notification successfully sent to admin`,
          Message: `${message}`,
        };
      } else {
        console.error(
          'Failed to send Telegram notification:',
          response.statusText,
        );
        console.log(response);
        if (response.statusText == 'Unauthorized') {
          throw new HttpException(
            {
              Status: HttpStatus.UNAUTHORIZED,
              Error: `Bot token is not correct!`,
            },
            HttpStatus.UNAUTHORIZED,
          );
        }
        if (response.statusText == 'Bad Request') {
          throw new HttpException(
            {
              Status: HttpStatus.BAD_REQUEST,
              Error: `Chat Id is not correct!`,
            },
            HttpStatus.BAD_REQUEST,
          );
        }
      }
    } catch (error) {
      throw error;
    }
  }
}
