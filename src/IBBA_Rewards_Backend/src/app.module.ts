import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailerModule } from '@nestjs-modules/mailer';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ForgetPasswordModule } from './forget-password/forget-password.module';
import OrmConfig from '../ormConfig';
import { config } from 'dotenv';
import { ChangePasswordModule } from './changePassword/change-password/change-password.module';
import { MoralisApisModule } from './moralis-apis/moralis-apis.module';
import { Web3ServiceModule } from './web3-service/web3-service.module';
import { RewardService } from './reward/reward.service';
import { RewardController } from './reward/reward.controller';
import { RewardModule } from './reward/reward.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ListingNftsModule } from './listing-nfts/listing-nfts.module';
import { AdminPanelModule } from './admin-panel/admin-panel.module';
import { BadgesDistributionCronService } from './badges/badgesDistributionCron.service';
import { BadgesModule } from './badges/badges.module';
import { OpenSeaWebSocketModule } from './open-sea-web-socket/open-sea-web-socket.module';
import { TelegramNotificationModule } from './telegram-notification/telegram-notification.module';
import { EmailNotificationModule } from './email-notification/email-notification.module';
import { NotificationsModule } from './notifications/notifications.module';
config();

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forRoot(OrmConfig),
    MailerModule.forRoot({
      transport: {
        host: process.env.MAILERHOST,
        port: parseInt(process.env.MAILERPORT, 10),
        secure: false,
        auth: {
          user: process.env.MAILERUSER,
          pass: process.env.MAILERPASS,
        },
      },
      defaults: {
        from: process.env.MAILERFROM,
      },
    }),
    ScheduleModule.forRoot(),
    ForgetPasswordModule,
    ChangePasswordModule,
    MoralisApisModule,
    Web3ServiceModule,
    RewardModule,
    ListingNftsModule,
    TypeOrmModule.forFeature([]),
    AdminPanelModule,
    BadgesModule,
    OpenSeaWebSocketModule,
    TelegramNotificationModule,
    EmailNotificationModule,
    NotificationsModule,
  ],
  controllers: [AppController, RewardController],
  providers: [AppService, RewardService, BadgesDistributionCronService],
})
export class AppModule {}
