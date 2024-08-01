import { Module } from '@nestjs/common';
import { EmailNotificationController } from './email-notification.controller';
import { EmailNotificationService } from './email-notification.service';
import { EmailService } from 'src/otp/services/email.service';

@Module({
  controllers: [EmailNotificationController],
  providers: [EmailNotificationService, EmailService],
})
export class EmailNotificationModule {}
