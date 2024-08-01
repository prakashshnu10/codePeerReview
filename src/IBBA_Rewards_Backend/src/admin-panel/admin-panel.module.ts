import { Module } from '@nestjs/common';
import { AdminPanelController } from './admin-panel.controller';
import { AdminPanelService } from './admin-panel.service';
import { OtpService } from 'src/otp/services/generateotp.service';
import { EmailService } from 'src/otp/services/email.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { config } from 'dotenv';
import { JwtModule } from '@nestjs/jwt';
import { WalletBalanceNotificationService } from './walletBalanceNotification.service';
config();

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      // eslint-disable-next-line @typescript-eslint/no-shadow, @typescript-eslint/no-unused-vars
      useFactory: (config: ConfigService) => {
        return {
          secret: process.env.JWT_SECRET_KEY,
          signOptions: {
            expiresIn: process.env.JWT_EXPIRES,
          },
        };
      },
    }),
    TypeOrmModule.forFeature([]),
  ],
  controllers: [AdminPanelController],
  providers: [
    AdminPanelService,
    OtpService,
    EmailService,
    WalletBalanceNotificationService,
  ],
})
export class AdminPanelModule {}
