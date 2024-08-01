import {
  Controller,
  Get,
  Param,
  ValidationPipe,
  UsePipes,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { RewardService } from './reward.service';
import logger from '../helper/logger';

@Controller('reward')
export class RewardController {
  constructor(private rewardService: RewardService) {}

  @UsePipes(new ValidationPipe())
  @Get('/earnings/:id')
  async getEarningByUserId(@Param('id') id: string): Promise<any> {
    try {
      logger.info('getEarningByUserId');
      const userData = await this.rewardService.getUserRewardEarnings(id);
      return userData;
    } catch (error) {
      logger.error('getEarningByUserId::error', error);
      if (error instanceof QueryFailedError) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: ['Invalid Id'],
          },
          HttpStatus.BAD_REQUEST,
        );
      } else {
        logger.error('getEarningByUserId::errror', error);
        throw error;
      }
    }
  }

  @UsePipes(new ValidationPipe())
  @Get('/structure/:id')
  async getRewardStructureByUserId(@Param('id') id: string): Promise<any> {
    try {
      logger.info('getRewardStructureByUserId');
      const userData = await this.rewardService.getRewardStructure(id);
      return userData;
    } catch (error) {
      logger.error('getRewardStructureByUserId::error', error);
      if (error instanceof QueryFailedError) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: ['Invalid Id'],
          },
          HttpStatus.BAD_REQUEST,
        );
      } else {
        logger.error('getRewardStructureByUserId::errorr', error);
        throw error;
      }
    }
  }

  @UsePipes(new ValidationPipe())
  @Get('/totalreferrals/:id')
  async getUserReferrals(@Param('id') id: string): Promise<any> {
    try {
      logger.info('getUserReferrals');
      const userData = await this.rewardService.getTotalReferralsOfUserById(id);
      return userData;
    } catch (error) {
      logger.error('Total referrals::error', error);
      if (error instanceof QueryFailedError) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: ['Invalid Id'],
          },
          HttpStatus.BAD_REQUEST,
        );
      } else {
        logger.error('getUserReferrals::error', error);
        throw error;
      }
    }
  }
}
