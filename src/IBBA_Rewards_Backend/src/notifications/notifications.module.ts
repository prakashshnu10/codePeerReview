import { Module } from '@nestjs/common';
import { NotificationsService } from './services/notifications.service';
import { NotificationsController } from './controller/notifications.controller';
import { EmailNotificationService } from 'src/email-notification/email-notification.service';
import { EmailService } from 'src/otp/services/email.service';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService,EmailService, EmailNotificationService]
})
export class NotificationsModule {}
