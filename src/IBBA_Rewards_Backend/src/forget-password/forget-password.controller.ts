import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
  Put,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';

import { Connection, QueryFailedError } from 'typeorm';
import { OtpService } from '../otp/services/generateotp.service';
import { EmailService } from '../otp/services/email.service';
import { ResetPasswordDto } from './dto/forget-password.dto';
import { ForgetPasswordService } from './services/forget-password.service';
import logger from '../helper/logger';
import { getConstantValue } from '../helper/dbHelper';
@Controller('verify')
export class ForgetPasswordController {
  constructor(
    private forgetPasswordService: ForgetPasswordService,
    private otpService: OtpService,
    private emailService: EmailService,
    private readonly dbConnection: Connection,
  ) {}

  @Post('/otp')
  async getEmail(@Body('email') email: string) {
    try {
      logger.info('getEmail');
      if (!email) {
        throw new HttpException(
          {
            message: ['Email should be required'],
            statusCode: HttpStatus.BAD_REQUEST,
          },
          HttpStatus.BAD_REQUEST,
        );
      }
      const user = await this.forgetPasswordService.findUserByEmail(email);
      if (user.length < 1) {
        throw new HttpException(
          {
            statusCode: HttpStatus.NOT_FOUND,
            message: ['No user found'],
          },
          HttpStatus.NOT_FOUND,
        );
      }
      user[0].is_verified = true;
      const value = await getConstantValue(this.dbConnection, 'is_verified');
      const query = `CALL put_user_by_user_id('{"${value}": ${user[0].is_verified}}'::jsonb, '${user[0].user_id}' )`;
      await this.dbConnection.query(query);
      if (user[0] && user[0].email == email) {
        return {
          message: ['Email verified successfully'],
          otp: user[0].otp,
          statusCode: HttpStatus.CREATED,
        };
      } else {
        return {
          message: ['Email verification failed'],
          statusCode: HttpStatus.BAD_REQUEST,
        };
      }
    } catch (error) {
      logger.error('getEmail::error', error);
      throw error;
    }
  }

  @Post('/email')
  async verifyEmail(@Body('email') email: string) {
    try {
      logger.info('verifyEmail');
      if (!email) {
        throw new HttpException(
          {
            message: ['Email is required'],
            statusCode: HttpStatus.BAD_REQUEST,
          },
          HttpStatus.BAD_REQUEST,
        );
      }
      const user = await this.forgetPasswordService.findUserByEmail(email);
      if (user.length < 1) {
        throw new HttpException(
          {
            statusCode: HttpStatus.NOT_FOUND,
            message: ['No user found'],
          },
          HttpStatus.NOT_FOUND,
        );
      }
      user[0].is_verified = true;
      if (user[0] && user[0].email == email) {
        const otp = this.otpService.generateOtp();
        await this.emailService.sendEmailForgetForPassword(
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
      logger.error('verifyEmail::error', e);
      throw e;
    }
  }

  @UsePipes(new ValidationPipe())
  @Put('/resetpassword')
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<any> {
    try {
      logger.info('resetPassword');
      const data = await this.forgetPasswordService.resetPassword(
        resetPasswordDto.email,
        resetPasswordDto,
      );
      return data;
    } catch (error) {
      logger.error(error);
      if (error instanceof QueryFailedError) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: ['Invalid email'],
          },
          HttpStatus.BAD_REQUEST,
        );
      } else {
        logger.error('resetPassword::error', error);
        throw error;
      }
    }
  }
}
