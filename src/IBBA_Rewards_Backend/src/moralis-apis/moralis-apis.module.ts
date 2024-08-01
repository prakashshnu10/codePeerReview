import { Module } from '@nestjs/common';
import { MoralisApisService } from './service/moralis-apis.service';
import { MoralisApisController } from './controller/moralis-apis.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { NftIdService } from './service/nftId.service';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
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
  controllers: [MoralisApisController],
  providers: [MoralisApisService, ConfigService, NftIdService],
})
export class MoralisApisModule {}
