import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Connection } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { getConstantValue } from '../../helper/dbHelper';
import logger from '../../helper/logger';

@Injectable()
export class ChangePasswordService {
  constructor(private readonly dbConnection: Connection) {}

  async updatePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<any> {
    try {
      logger.info('updatePassword');
      const userIdValue = await getConstantValue(this.dbConnection, 'user_id');
      const userIdquery = `SELECT * FROM public.get_user('${userIdValue}', '${userId}')`;
      const user = await this.dbConnection.query(userIdquery);
      if (user.length < 1) {
        throw new HttpException(
          {
            statusCode: HttpStatus.NOT_FOUND,
            message: ['No user found'],
          },
          HttpStatus.NOT_FOUND,
        );
      }

      const { oldPassword, newPassword, confirmPassword } = changePasswordDto;
      const isPasswordValid = await bcrypt.compare(
        oldPassword,
        user[0].password,
      );

      if (!isPasswordValid) {
        throw new UnauthorizedException({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: ['Invalid old password'],
        });
      }

      if (newPassword !== confirmPassword) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: ['New password and confirm password should be same!'],
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      if (oldPassword === newPassword) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: ['New password and old password cannot be same!'],
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const passwordValue = await getConstantValue(
        this.dbConnection,
        'password',
      );

      const query = `CALL put_user_by_user_id('{"${passwordValue}": "${hashedPassword}"}'::jsonb, '${userId}' );`;
      await this.dbConnection.query(query);
      return {
        message: ['Password updated successfully'],
        statusCode: HttpStatus.OK,
      };
    } catch (e) {
      logger.error('updatePassword::error', e);
      throw e;
    }
  }
}
