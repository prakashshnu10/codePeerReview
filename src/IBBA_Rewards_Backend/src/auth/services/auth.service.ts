/* eslint-disable @typescript-eslint/naming-convention */
import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { SignUpDto } from '../dto/signup.dto';
import { LoginDto } from '../dto/login.dto';
import { Connection } from 'typeorm';
import { generateAlphanumeric } from 'src/helper/randomNumber';
import logger from '../../helper/logger';
import { getConstantValue } from '../../helper/dbHelper';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private readonly dbConnection: Connection,
  ) {}

  //*registerUser
  async signUp(signupDto: SignUpDto, otp: string): Promise<any> {
    try {
      logger.info('signUp::register');
      const {
        first_name,
        last_name,
        email,
        password,
        referral_code,
        confirmPassword,
      } = signupDto;
      for (const key in signupDto) {
        if (typeof signupDto[key] === 'string') {
          signupDto[key] = signupDto[key].trim();
        }
      }

      if (signupDto.first_name === '') {
        throw new HttpException(
          {
            message: ['First Name must be at least 3 characters long'],
            statusCode: HttpStatus.BAD_REQUEST,
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      if (signupDto.last_name === '') {
        throw new HttpException(
          {
            message: ['Last Name must be at least 1 characters long'],
            statusCode: HttpStatus.BAD_REQUEST,
          },
          HttpStatus.BAD_REQUEST,
        );
      }
      if (password !== confirmPassword) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: ['Password and confirm password should be same!'],
          },
          HttpStatus.BAD_REQUEST,
        );
      }
      const data = await getConstantValue(this.dbConnection, 'referral_code');
      const query = `SELECT * FROM public.get_user('${data}', '${referral_code.toUpperCase()}')`;
      const userReferralCode = await this.dbConnection.query(query);

      if (userReferralCode.length < 1) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: [
              'Invalid Referral code, Please enter valid referral code',
            ],
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const generateAlphanumericValue = generateAlphanumeric(
        first_name,
        last_name,
      );
      const currentUserLevel = parseInt(userReferralCode[0].level, 10);
      const newLevel = (currentUserLevel + 1).toString();
      const hashedPassword = await bcrypt.hash(password, 10);
      const createQuery =
        'CALL post_register_user($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)';
      const userData = await this.dbConnection.query(createQuery, [
        email,
        first_name,
        last_name,
        hashedPassword,
        false,
        otp,
        null,
        generateAlphanumericValue,
        userReferralCode[0].user_id,
        `${first_name} ${last_name}`,
        newLevel,
      ]);
      const token = this.jwtService.sign({
        ...userData,
      });
      return { userData, token };
    } catch (error) {
      logger.error('signUp::error', error);
      throw error;
    }
  }

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

  async emailExists(email: string): Promise<any> {
    try {
      logger.info('emailExists');
      const data = await getConstantValue(this.dbConnection, 'email');
      const query = `SELECT * FROM public.get_user('${data}', '${email}')`;
      const user = await this.dbConnection.query(query);
      if (user.length > 0) {
        throw new ConflictException({
          message: [`${email} already exists`],
          statusCode: HttpStatus.CONFLICT,
        });
      }
      return user;
    } catch (e) {
      logger.error('Email exists::', e);
      throw e;
    }
  }

  async userWalletExists(user_wallet: string): Promise<any> {
    try {
      logger.info('userWalletExists');
      const data = await getConstantValue(this.dbConnection, 'user_wallet');
      const query = `SELECT * FROM public.get_user('${data}',$1)`;
      const values = [user_wallet.toLowerCase()];
      const user = await this.dbConnection.query(query, values);
      if (user.length > 0) {
        throw new ConflictException({
          message: ['Wallet already exists'],
          statusCode: HttpStatus.CONFLICT,
        });
      }
    } catch (e) {
      logger.error('User Wallet Exists::', e);
      throw e;
    }
  }

  async userIdExists(user_id: string): Promise<any> {
    try {
      logger.info('userIdExists');
      const data = await getConstantValue(this.dbConnection, 'user_id');
      const query = `SELECT * FROM public.get_user_nft('${data}',$1)`;
      const values = [user_id];
      const user = await this.dbConnection.query(query, values);
      if (user.length > 0) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: [
              'You have already bought nft, you cannot update wallet address',
            ],
          },
          HttpStatus.BAD_REQUEST,
        );
      }
    } catch (e) {
      logger.error('User Id Exists::', e);
      throw e;
    }
  }

  //*save wallet address of user
  async safeWaletAddress(user_wallet: string, user_id: string) {
    try {
      logger.info('safeWaletAddress');
      const data = await getConstantValue(this.dbConnection, 'user_id');
      const userIdquery = `SELECT * FROM public.get_user('${data}', '${user_id}')`;
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

      await this.userIdExists(user_id);
      await this.userWalletExists(user_wallet);
      const walletValue = await getConstantValue(
        this.dbConnection,
        'user_wallet',
      );
      const query = `CALL put_user_by_user_id('{"${walletValue}": "${user_wallet.toLowerCase()}"}'::jsonb, '${user_id}' );`;
      await this.dbConnection.query(query);
      return {
        message: ['Wallet address updated successfully'],
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      logger.error('save wallet address::', error);
      throw error;
    }
  }

  //*login user
  async login(loginDto: LoginDto): Promise<{ token: string; user: LoginDto }> {
    try {
      logger.info('user login');
      const { email, password } = loginDto;
      const emailValue = await getConstantValue(this.dbConnection, 'email');
      const query = `SELECT * FROM public.get_user('${emailValue}', '${email}')`;
      const user = await this.dbConnection.query(query);
      if (user.length < 1) {
        throw new UnauthorizedException({
          statusCode: HttpStatus.NOT_FOUND,
          message: ['No user found'],
        });
      }

      if (user[0].is_verified === null || user[0].is_verified === false) {
        throw new UnauthorizedException({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: ['You are not verified'],
        });
      }

      const isPasswordValid = await bcrypt.compare(password, user[0].password);

      if (!isPasswordValid) {
        throw new UnauthorizedException({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: ['Invalid password'],
        });
      }
      const token = this.jwtService.sign({ user_id: user[0].user_id });
      return { user, token };
    } catch (error) {
      logger.error('user login::error', error);
      throw error;
    }
  }

  async getUserById(userId: string): Promise<any> {
    try {
      logger.info('getUserById');
      const data = await getConstantValue(this.dbConnection, 'user_id');
      const query = `SELECT * FROM public.get_user('${data}', '${userId}')`;
      const user = await this.dbConnection.query(query);
      if (user.length < 1) {
        throw new HttpException(
          {
            statusCode: HttpStatus.NOT_FOUND,
            message: ['No user found'],
          },
          HttpStatus.NOT_FOUND,
        );
      }
      return user;
    } catch (error) {
      logger.error('Get user By Id::', error);
      throw error;
    }
  }
}
