import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
  ValidationPipe,
  UsePipes,
  Get,
  Param,
  Put,
  Query,
} from '@nestjs/common';
import { AdminPanelService } from './admin-panel.service';
import { QueryFailedError } from 'typeorm';
import { OtpService } from 'src/otp/services/generateotp.service';
import { EmailService } from 'src/otp/services/email.service';
import logger from '../helper/logger';
import { AdminLoginDto } from './dto/admin-pannel.dto';
import { RewardPercentageDistributionDto } from './dto/rewardPercentageDistribution';

@Controller('admin')
export class AdminPanelController {
  constructor(
    private adminPanelService: AdminPanelService,
    private otpService: OtpService,
    private emailService: EmailService,
  ) {}

  @Post('/email')
  async verifyEmail(@Body('email') email: string) {
    try {
      logger.info('verifyEmail');
      if (!email) {
        throw new HttpException(
          {
            message: ['Email should be required'],
            statusCode: HttpStatus.BAD_REQUEST,
          },
          HttpStatus.BAD_REQUEST,
        );
      }
      const user = await this.adminPanelService.findUserByEmail(email);
      if (user.length < 1) {
        throw new HttpException(
          {
            statusCode: HttpStatus.NOT_FOUND,
            message: ['No user found'],
          },
          HttpStatus.NOT_FOUND,
        );
      }
      if (user[0] && user[0].email == email) {
        const otp = this.otpService.generateOtp();
        await this.emailService.sendEmailToAdmin(
          email,
          otp,
          user[0].first_name,
        );
        return {
          message: ['OTP sent to Email'],
          statusCode: HttpStatus.CREATED,
        };
      } else {
        return {
          message: ['Email verification failed'],
          statusCode: HttpStatus.BAD_REQUEST,
        };
      }
    } catch (e) {
      logger.error('error::send email::verifyEmail', e);
      throw e;
    }
  }

  @Post('/login')
  @UsePipes(new ValidationPipe())
  async adminLogin(@Body() adminLoginDto: AdminLoginDto): Promise<any> {
    logger.info('adminLogin');
    return this.adminPanelService.adminLogin(adminLoginDto);
  }

  @UsePipes(new ValidationPipe())
  @Get('/reward/:id')
  async getAllRewardLevel(@Param('id') userId: string): Promise<any> {
    try {
      logger.info('getAllRewardLevel');
      const data = await this.adminPanelService.getAllRewardLevel(userId);
      return data;
    } catch (error) {
      if (error instanceof QueryFailedError) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: ['Invalid Id'],
          },
          HttpStatus.BAD_REQUEST,
        );
      } else {
        logger.error('getAllRewardLevel::error', error);
        throw error;
      }
    }
  }

  @UsePipes(new ValidationPipe())
  @Put('/reward/:id')
  async updateRewardPercentage(
    @Param('id') userId: string,
    // eslint-disable-next-line @typescript-eslint/indent
    @Body() rewardPercentageDistributionDto: RewardPercentageDistributionDto,
  ): Promise<any> {
    try {
      logger.info('updateRewardPercentage');
      const data = await this.adminPanelService.updateRewardPercentage(
        userId,
        rewardPercentageDistributionDto,
      );
      return data;
    } catch (error) {
      logger.error(error);
      if (error instanceof QueryFailedError) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: ['Invalid Id'],
          },
          HttpStatus.BAD_REQUEST,
        );
      } else {
        logger.error('Update reward Percentage', error);
        throw error;
      }
    }
  }

  @UsePipes(new ValidationPipe())
  @Get('/rewardhistory/:id')
  async getRewardHistory(
    @Param('id') userId: string,
    @Query('page') page: number = 1,
    @Query('perPage') perPage: number = 10,
    @Query('search') search: string,
    @Query('filter') filter: string,
    @Query('startDate') startDate: Date,
    @Query('endDate') endDate: Date,
  ): Promise<any> {
    try {
      logger.info('getRewardHistory');
      const data = await this.adminPanelService.getRewardHistory(
        userId,
        page,
        perPage,
        search,
        filter,
        startDate,
        endDate,
      );
      return data;
    } catch (error) {
      if (error instanceof QueryFailedError) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: ['Invalid Id'],
          },
          HttpStatus.BAD_REQUEST,
        );
      } else {
        logger.error('getRewardHistory', error);
        throw error;
      }
    }
  }
}
