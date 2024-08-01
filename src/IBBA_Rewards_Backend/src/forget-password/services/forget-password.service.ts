import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Connection } from 'typeorm';
import { ResetPasswordDto } from '../dto/forget-password.dto';
import * as bcrypt from 'bcryptjs';
import { getConstantValue } from '../../helper/dbHelper';
import logger from '../../helper/logger';

@Injectable()
export class ForgetPasswordService {
  constructor(private readonly dbConnection: Connection) {}

  async findUserByEmail(email: string): Promise<any> {
    try {
      logger.info('findUserByEmail');
      const data = await getConstantValue(this.dbConnection, 'email');
      const query = `SELECT * FROM public.get_user('${data}', '${email}')`;
      const user = await this.dbConnection.query(query);
      if (user.length < 1) {
        throw new HttpException(
          {
            statusCode: HttpStatus.NOT_FOUND,
            message: ['Incorrect Email Id, User not found'],
          },
          HttpStatus.NOT_FOUND,
        );
      }
      return user;
    } catch (e) {
      logger.error('findUserByEmail::error', e);
      throw e;
    }
  }

  async resetPassword(
    email: string,
    resetPasswordDto: ResetPasswordDto,
  ): Promise<any> {
    try {
      logger.info('resetPassword');
      const dataValue = await getConstantValue(this.dbConnection, 'email');
      const emailQuery = `SELECT * FROM public.get_user('${dataValue}',$1)`;
      const values = [email];
      const user = await this.dbConnection.query(emailQuery, values);
      if (user.length < 1) {
        throw new HttpException(
          {
            statusCode: HttpStatus.NOT_FOUND,
            message: ['Incorrect Email Id, User not found'],
          },
          HttpStatus.NOT_FOUND,
        );
      }
      const { newPassword, confirmPassword } = resetPasswordDto;

      if (newPassword !== confirmPassword) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: ['New password and confirm password should be same!'],
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const passwordValue = await getConstantValue(
        this.dbConnection,
        'password',
      );

      const query = `CALL put_user_by_user_id('{"${passwordValue}": "${hashedPassword}"}'::jsonb, '${user[0].user_id}' );`;
      await this.dbConnection.query(query);
      return {
        message: ['Password reset successfully'],
        statusCode: HttpStatus.OK,
      };
    } catch (e) {
      logger.error('resetPassword::error', e);
      throw e;
    }
  }
}
