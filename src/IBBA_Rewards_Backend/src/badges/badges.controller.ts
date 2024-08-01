import {
  Controller,
  Param,
  ValidationPipe,
  UsePipes,
  Get,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { BadgesService } from './badges.service';
import { QueryFailedError } from 'typeorm';
import logger from '../helper/logger';

@Controller('badges')
export class BadgesController {
  constructor(private badgeService: BadgesService) {}

  @UsePipes(new ValidationPipe())
  @Get('/user/:id')
  async getUserByUserId(@Param('id') userId: string): Promise<any> {
    try {
      logger.info('getUserByUserId::Badges');
      const userData = await this.badgeService.getBadgeDistributionById(userId);
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
}
