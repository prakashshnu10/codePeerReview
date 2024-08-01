import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RewardController } from './reward.controller';
import { AuthService } from 'src/auth/services/auth.service';
import { RewardService } from './reward.service';
import { RewardCronService } from './cronReward.service';
import { DirectSaleRewardService } from './directSaleRewardDistribution';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([])],
  controllers: [RewardController],
  providers: [
    AuthService,
    RewardCronService,
    JwtService,
    RewardService,
    DirectSaleRewardService,
  ],
  exports: [RewardService],
})
export class RewardModule {}
