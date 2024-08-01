import {
  Controller,
  Param,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Body,
} from '@nestjs/common';
import { NotificationsService } from '../services/notifications.service';
import { QueryFailedError } from 'typeorm';
import logger from 'src/helper/logger';
import { EmailNotificationService } from 'src/email-notification/email-notification.service';

@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailNotificationService,
  ) {}

  @Get('/user-notifications/:id')
  async getNotificationsByID(@Param('id') userId: string): Promise<any> {
    try {
      logger.info('getNotificationsByID');
      const userData = await this.notificationsService.notifications(userId);
      return userData;
    } catch (error) {
      logger.error('getUserByUserId::error', error);
      if (error instanceof QueryFailedError) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: ['Invalid Id'],
          },
          HttpStatus.BAD_REQUEST,
        );
      } else {
        throw error;
      }
    }
  }

  // get count of unread notifications
  @Get('/user-notifications-count/:id')
  async getUnreadNotificationsByID(@Param('id') userId: string): Promise<any> {
    try {
      logger.info('getNotificationsByID');
      const userData = await this.notificationsService.unreadNotificationsCount(
        userId,
      );
      return userData;
    } catch (error) {
      logger.error('getUserByUserId::error', error);
      if (error instanceof QueryFailedError) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: ['Invalid Id'],
          },
          HttpStatus.BAD_REQUEST,
        );
      } else {
        throw error;
      }
    }
  }

  @Post('/user-notifications/:notification_id/:user_id')
  async markNotification(
    @Param('notification_id') notificationId: string,
    @Param('user_id') userId: string,
    @Body() read_status: string,
  ): Promise<any> {
    try {
      const response = await this.notificationsService.markNotification(
        notificationId,
        userId,
        read_status['read_status'],
      );
      logger.info('getNotificationsByID');
      return response;
    } catch (error) {
      logger.error('getUserByUserId::error', error);
      if (error instanceof QueryFailedError) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: ['Invalid Id'],
          },
          HttpStatus.BAD_REQUEST,
        );
      } else {
        throw error;
      }
    }
  }

  @Post('/user-notifications-read-all/:user_id')
  async markallNotificationasRead(
    @Param('user_id') userId: string,
    @Body() read_status: string,
  ): Promise<any> {
    try {
      const response = await this.notificationsService.markallNotifications(
        userId,
        read_status['read_status'],
      );
      logger.info('getNotificationsByID');
      return response;
    } catch (error) {
      logger.error('getUserByUserId::error', error);
      if (error instanceof QueryFailedError) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: ['Invalid Id'],
          },
          HttpStatus.BAD_REQUEST,
        );
      } else {
        throw error;
      }
    }
  }
}
