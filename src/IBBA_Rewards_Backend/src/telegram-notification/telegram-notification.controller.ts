import { Controller, Get, Post } from '@nestjs/common';
import { TelegramNotificationService } from './telegram-notification.service';

@Controller('telegram-notification')
export class TelegramNotificationController {
    constructor(private readonly telegramService: TelegramNotificationService) {}

    @Get('send-notification')
    async notification(){
    const result = await this.telegramService.sendNotification('Greetings from Nu10 Technologies!');
    return result;

    }

}
