import { Module } from '@nestjs/common';
import { EmailService } from './services/email.service';
import { AuthService } from 'src/auth/services/auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { OtpService } from './services/generateotp.service';
import { AuthController } from 'src/auth/auth.controller';

@Module({
  imports: [TypeOrmModule.forFeature([])],
  controllers: [AuthController],
  providers: [EmailService, AuthService, JwtService, OtpService],
})
export class EmailModule {}
