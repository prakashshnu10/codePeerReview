import { Module } from '@nestjs/common';
import { ForgetPasswordController } from './forget-password.controller';
import { ForgetPasswordService } from './services/forget-password.service';
import { AuthService } from '../auth/services/auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { OtpService } from '../otp/services/generateotp.service';
import { EmailService } from '../otp/services/email.service';

@Module({
  imports: [TypeOrmModule.forFeature([])],
  controllers: [ForgetPasswordController],
  providers: [
    ForgetPasswordService,
    AuthService,
    JwtService,
    OtpService,
    EmailService,
  ],
})
export class ForgetPasswordModule {}
