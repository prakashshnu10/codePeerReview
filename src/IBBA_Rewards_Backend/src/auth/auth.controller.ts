import {
  Body,
  Controller,
  Post,
  Get,
  Param,
  Patch,
  UsePipes,
  ValidationPipe,
  HttpException,
  HttpStatus,
  ConflictException,
} from '@nestjs/common';
import { SignUpDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { QueryFailedError } from 'typeorm';
import { ValidateUserWalletDto } from './dto/userWallet.dto';
import { EmailService } from 'src/otp/services/email.service';
import { OtpService } from 'src/otp/services/generateotp.service';
import { AuthService } from './services/auth.service';
import logger from '../helper/logger';

@Controller('auth')
export class AuthController {
  constructor(
    private otpService: OtpService,
    private emailService: EmailService,
    private authService: AuthService,
  ) {}

  //*register
  @UsePipes(new ValidationPipe())
  @Post('/signup')
  async signup(@Body() signUpdto: SignUpDto): Promise<any> {
    try {
      logger.info('signup');
      const { email, first_name } = signUpdto;
      await this.authService.emailExists(signUpdto.email);
      const otp = this.otpService.generateOtp();

      await this.authService.signUp(signUpdto, otp);
      await this.emailService.sendEmail(email, otp, first_name);

      return { statusCode: HttpStatus.OK, message: ['OTP sent to email'] };
    } catch (e) {
      logger.error('signup::error::', e);
      throw e;
    }
  }

  //*connect wallet address
  @UsePipes(new ValidationPipe())
  @Patch('/validate/wallet/:id')
  async validateWallet(
    @Body() validateWalletDto: ValidateUserWalletDto,
    @Param('id') id: string,
  ): Promise<any> {
    try {
      logger.info('validateWallet');
      const { user_wallet } = validateWalletDto;
      const isValid = isValidAddress(user_wallet);
      let data;
      if (isValid) {
        data = await this.authService.safeWaletAddress(user_wallet, id);
      }
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
        logger.error('error::validateWallet', error);
        throw error;
      }
    }
  }

  //*Login
  @Post('/login')
  @UsePipes(new ValidationPipe())
  async login(@Body() loginDto: LoginDto): Promise<any> {
    logger.info('user login');
    return this.authService.login(loginDto);
  }

  //*GetUsersDetailsByUserId
  @UsePipes(new ValidationPipe())
  @Get('/user/:id')
  async getUserByUserId(@Param('id') userId: string): Promise<any> {
    try {
      logger.info('getUserByUserId');
      const userData = await this.authService.getUserById(userId);
      return userData;
    } catch (error) {
      logger.error('get user::error', error);
      if (error instanceof QueryFailedError) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: ['Invalid Id'],
          },
          HttpStatus.BAD_REQUEST,
        );
      } else {
        logger.error('getUserByUserId::errorr', error);
        throw error;
      }
    }
  }
}

function isValidAddress(address: string): boolean {
  logger.info('isValidAddress');
  const addressPattern = /^(0x)?[0-9a-fA-F]{40}$/;
  return addressPattern.test(address);
}
