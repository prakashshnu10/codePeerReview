import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Param,
  Put,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { ChangePasswordService } from './change-password.service';
import { QueryFailedError } from 'typeorm';
import logger from '../../helper/logger';

@Controller('profile')
export class ChangePasswordController {
  constructor(private changePasswordService: ChangePasswordService) {}

  @UsePipes(new ValidationPipe())
  @Put('/changepassword/:id')
  async updatePassword(
    @Param('id') userId: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<any> {
    try {
      logger.info('updatePassword');
      const data = await this.changePasswordService.updatePassword(
        userId,
        changePasswordDto,
      );
      return data;
    } catch (error) {
      logger.error('updatePassword::error', error);
      if (error instanceof QueryFailedError) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: ['Invalid Id'],
          },
          HttpStatus.BAD_REQUEST,
        );
      } else {
        logger.error('updatePassword:error', error);
        throw error;
      }
    }
  }
}
