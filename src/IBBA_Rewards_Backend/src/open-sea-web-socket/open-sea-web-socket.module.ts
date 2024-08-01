import { Module } from '@nestjs/common';
import { OpenSeaWebSocketController } from './open-sea-web-socket.controller';
import { OpenSeaWebSocketService } from './open-sea-web-socket.service';
import { BadgesDistributionCronService } from 'src/badges/badgesDistributionCron.service';
import { RewardCronService } from 'src/reward/cronReward.service';
import { DirectSaleRewardService } from 'src/reward/directSaleRewardDistribution';
import { TelegramNotificationService } from '../telegram-notification/telegram-notification.service';
import { Web3ServiceService } from 'src/web3-service/service/web3-service.service';
import { SucceededRewardDistributionAddress } from 'src/web3-service/succeededRewardAddress';
import { FailedRewardDistributionAddress } from 'src/web3-service/failedRewardAddress';
import { MoralisApisService } from '../moralis-apis/service/moralis-apis.service';
import { NftIdService } from '../moralis-apis/service/nftId.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailNotificationService } from 'src/email-notification/email-notification.service';
import { EmailService } from 'src/otp/services/email.service';

@Module({
  controllers: [OpenSeaWebSocketController],
  providers: [
    OpenSeaWebSocketService,
    BadgesDistributionCronService,
    RewardCronService,
    DirectSaleRewardService,
    Web3ServiceService,
    TelegramNotificationService,
    SucceededRewardDistributionAddress,
    FailedRewardDistributionAddress,
    MoralisApisService,
    NftIdService,
    ConfigService,
    EmailNotificationService,
    EmailService,
  ],
})
export class OpenSeaWebSocketModule {}
