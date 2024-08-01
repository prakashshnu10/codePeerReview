import { Module } from '@nestjs/common';
import { TelegramNotificationService } from './telegram-notification.service';
import { TelegramNotificationController } from './telegram-notification.controller';

@Module({
  providers: [TelegramNotificationService],
  controllers: [TelegramNotificationController]
})
export class TelegramNotificationModule {}
