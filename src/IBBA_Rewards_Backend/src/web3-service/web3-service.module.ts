import { Module } from '@nestjs/common';
import { Web3ServiceService } from './service/web3-service.service';
import { Web3ServiceController } from './controller/web3-service.controller';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { SucceededRewardDistributionAddress } from './succeededRewardAddress';
import { FailedRewardDistributionAddress } from './failedRewardAddress';
import { ExtractedWallets } from './extractedWallet';
import { MoralisApisService } from 'src/moralis-apis/service/moralis-apis.service';
import { NftIdService } from 'src/moralis-apis/service/nftId.service';
import { TelegramNotificationService } from 'src/telegram-notification/telegram-notification.service';
import { EmailNotificationService } from 'src/email-notification/email-notification.service';
import { EmailService } from 'src/otp/services/email.service';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forFeature([]),
  ],
  providers: [
    Web3ServiceService,
    SucceededRewardDistributionAddress,
    FailedRewardDistributionAddress,
    ExtractedWallets,
    MoralisApisService,
    NftIdService,
    TelegramNotificationService,
    EmailNotificationService,
    EmailService,
  ],
  controllers: [Web3ServiceController],
})
export class Web3ServiceModule {}
