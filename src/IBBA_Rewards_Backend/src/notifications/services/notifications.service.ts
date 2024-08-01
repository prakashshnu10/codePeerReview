import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
// import { Cron, CronExpression } from '@nestjs/schedule';
import { delay } from 'src/helper/delay';
import logger from 'src/helper/logger';
// import { EmailService } from 'src/otp/services/email.service';
import { Connection } from 'typeorm';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly dbConnection: Connection, // private emailService: EmailService,
  ) {}

  // get all notifications of a user by Id
  async notifications(userId: string): Promise<any> {
    if (userId.includes(':id')) {
      throw new HttpException(
        {
          statusCode: HttpStatus.NOT_FOUND,
          message: ['Please enter id'],
        },
        HttpStatus.NOT_FOUND,
      );
    }
    try {
      logger.info('notifications');
      await delay(3000);
      const notifications = await this.dbConnection.query(
        `select * from t_user_notifications where user_id = '${userId}'`,
      );
      if (notifications.length < 1) {
        throw new HttpException(
          {
            statusCode: HttpStatus.NOT_FOUND,
            message: ['No notifications found'],
          },
          HttpStatus.NOT_FOUND,
        );
      }
      notifications.sort(
        (a: { created_at: number }, b: { created_at: number }) =>
          b.created_at - a.created_at,
      );
      // Map over the notifications and fetch the details of the NFT reward for each notification.
      const notificationsWithRewards = await Promise.all(
        notifications.map(async (notification) => {
          // Get the NFT reward ID from the notification.
          const rewardId = notification.t_user_nft_reward_id;
          const badgeId = notification.t_user_badges_id;
          const nftId = notification.t_user_nft_id;

          // If the NFT reward ID is not null, fetch the details of the NFT reward.
          if (rewardId) {
            let reward = await this.dbConnection.query(
              `select * from t_user_nft_reward where id = '${rewardId}'`,
            );
            if (reward.length <= 0) {
              return;
            }
            reward = reward[0];

            // Fetch the email of the user from the m_users table.
            const query = `select * from m_users where user_id ='${reward.from_user_id}'`;
            const userEmail = await this.dbConnection.query(query);
            const nft = await this.dbConnection.query(
              `select * from m_nft where id ='${reward.nft_id}'`,
            );
            let reward_level;
            if (reward.eligible_for_direct_sales) {
              reward_level = 1;
            } else {
              reward_level = await this.dbConnection.query(
                `select * from m_reward_level where id ='${reward.reward_level_id}'`,
              );
              reward_level = reward_level[0].level;
            }
            // Add the email of the user to the NFT reward object.
            reward.from_user_id = userEmail[0].email;
            reward.full_name = `${userEmail[0].first_name} ${userEmail[0].last_name}`;
            reward.nft_id = nft[0].token_id;
            reward.reward_level = reward_level;
            delete reward.reward_id;
            delete reward.reward_level_id;
            delete reward.id;
            delete reward.user_id;
            delete reward.created_at;
            delete reward.updated_at;
            delete reward.created_by;
            delete reward.updated_by;
            delete reward.notification;
            delete notification.bonus_status;
            notification.reward = reward;
          } else if (badgeId) {
            let badge = await this.dbConnection.query(
              `select * from t_user_badges where id = '${badgeId}'`,
            );
            if (badge.length <= 0) {
              return;
            }
            badge = badge[0];
            const allBadges = await this.dbConnection.query(
              `select * from m_badges`,
            );
            const removedBadges = [];
            let badgeWithId;

            for (let i = 0; i < allBadges.length; i++) {
              const badges = allBadges[i];
              removedBadges.push(badges.badge);
              badgeWithId = allBadges.find((b) => b.id === badge.badge_id);
            }
            let previousMember = null;

            for (let i = 0; i < removedBadges.length; i++) {
              if (removedBadges[i] === badgeWithId.badge && i === 0) {
                previousMember = null;
              } else if (i > 0 && removedBadges[i] === badgeWithId.badge) {
                previousMember = removedBadges[i - 1];
              }
            }
            const query = `select * from m_users where user_id ='${badge.user_id}'`;
            const userEmail = await this.dbConnection.query(query);

            delete badge.id;
            delete notification.reward_status;
            badge.user_id = userEmail[0].email;
            badge.full_name = `${userEmail[0].first_name} ${userEmail[0].last_name}`;
            badge.badge = badgeWithId.badge;
            badge.previousMember = previousMember;
            badge.nftCount = badgeWithId.min_nft_criteria;
            delete badge.created_at;
            delete badge.badge_id;
            delete badge.updated_at;
            delete badge.created_by;
            delete badge.updated_by;
            delete badge.notification;
            notification.badge = badge;
          } else if (nftId) {
            let nft = await this.dbConnection.query(
              `select * from t_user_nft where trx_id = '${nftId}'`,
            );
            if (nft.length <= 0) {
              return null;
            }
            nft = nft[0];
            const nft_id = await this.dbConnection.query(
              `select * from m_nft where id ='${nft.nft_id}'`,
            );

            const query = `select * from m_users where user_id ='${nft.user_id}'`;
            const userEmail = await this.dbConnection.query(query);
            nft.nft_id = nft_id[0].token_id;
            nft.image = nft_id[0].image;
            nft.user_id = userEmail[0].email;
            nft.title = nft_id[0].title;
            nft.full_name = `${userEmail[0].first_name} ${userEmail[0].last_name}`;
            delete nft.trx_id;
            delete nft.created_by;
            delete nft.updated_by;
            delete nft.created_at;
            delete nft.updated_at;
            delete notification.reward_status;
            delete notification.bonus_status;
            notification.nft = nft;
          }
          delete notification.user_id;
          delete notification.t_user_nft_reward_id;
          delete notification.t_user_badges_id;
          delete notification.t_user_nft_id;
          delete notification.created_by;
          delete notification.updated_by;

          // Return the notification with the NFT reward details.
          return {
            ...notification,
          };
        }),
      );

      // Return the notifications with the NFT reward details.
      // Create a new array to store the filtered notifications.
      const filteredNotifications = [];

      // Iterate over the original array and add each non-null notification to the filtered array.
      for (const notification of notificationsWithRewards) {
        if (notification !== null) {
          filteredNotifications.push(notification);
        }
      }

      // Return the filtered array.
      return filteredNotifications;
    } catch (error) {
      logger.error('directSalesRewardDue:::error', error);
      throw error;
    }
  }

  //mark the notification as read/unread of the user by userId and notificationId
  async markNotification(
    notificationId: string,
    userId: string,
    read_status: string,
  ): Promise<any> {
    if (userId.includes(':user_id')) {
      throw new HttpException(
        {
          statusCode: HttpStatus.NOT_FOUND,
          message: ['Please enter user_id'],
        },
        HttpStatus.NOT_FOUND,
      );
    } else if (notificationId.includes(':notification_id')) {
      throw new HttpException(
        {
          statusCode: HttpStatus.NOT_FOUND,
          message: ['Please enter notification_id'],
        },
        HttpStatus.NOT_FOUND,
      );
    }
    const notificationQuery = `select * from t_user_notifications where notification_id = '${notificationId}' AND user_id = '${userId}'`;
    const userNotification = await this.dbConnection.query(notificationQuery);

    if (read_status !== 'Unread' && read_status !== 'Read') {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          error: 'read_status must be Read/Unread',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    if (!userNotification) {
      throw new HttpException(
        {
          statusCode: HttpStatus.NOT_FOUND,
          error: `Notification with ID ${notificationId} and user ID ${userId} not found`,
        },
        HttpStatus.NOT_FOUND,
      );
    }
    if (userNotification[0].read_status === read_status) {
      throw new HttpException(
        {
          statusCode: HttpStatus.NOT_ACCEPTABLE,
          error: `already marked as ${read_status}`,
        },
        HttpStatus.NOT_ACCEPTABLE,
      );
    }

    const updateQuery = `update t_user_notifications set read_status = '${read_status}' where notification_id = '${notificationId}'`;
    const updateNotificationDB = await this.dbConnection.query(updateQuery);

    if (!updateNotificationDB) {
      throw new HttpException(
        {
          statusCode: HttpStatus.NOT_MODIFIED,
          error: 'Failed to update notification',
        },
        HttpStatus.NOT_MODIFIED,
      );
    }

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Notification successfully updated',
      data: null,
    };
  }

  //mark all the notifications as read/unread of the user by userId
  async markallNotifications(
    userId: string,
    read_status: string,
  ): Promise<any> {
    if (userId.includes(':user_id')) {
      throw new HttpException(
        {
          statusCode: HttpStatus.NOT_FOUND,
          message: ['Please enter user_id'],
        },
        HttpStatus.NOT_FOUND,
      );
    }
    const notificationQuery = `select * from t_user_notifications where user_id = '${userId}'`;
    const userNotification = await this.dbConnection.query(notificationQuery);

    if (read_status !== 'Unread' && read_status !== 'Read') {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          error: 'read_status must be Read/Unread',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    const alreadymarkedAll = userNotification.every(
      (notification) => notification.read_status === read_status,
    );
    if (alreadymarkedAll) {
      throw new HttpException(
        {
          statusCode: HttpStatus.NOT_ACCEPTABLE,
          error: `All notifications are already marked as ${read_status}`,
        },
        HttpStatus.NOT_ACCEPTABLE,
      );
    }

    if (!userNotification) {
      throw new HttpException(
        {
          statusCode: HttpStatus.NOT_ACCEPTABLE,
          error: `Notifications for user ID ${userId} not found`,
        },
        HttpStatus.NOT_ACCEPTABLE,
      );
    }

    const updateQuery = `update t_user_notifications set read_status = '${read_status}' where user_id = '${userId}' AND read_status != '${read_status}'`;
    const updateNotificationDB = await this.dbConnection.query(updateQuery);

    if (!updateNotificationDB) {
      throw new HttpException(
        {
          statusCode: HttpStatus.NOT_MODIFIED,
          error: 'Failed to update notifications',
        },
        HttpStatus.NOT_MODIFIED,
      );
    }

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Notifications successfully updated',
      data: null,
    };
  }

  //get all the notifications as read/unread count of the user by userId
  async unreadNotificationsCount(userId: string): Promise<any> {
    if (userId.includes(':id')) {
      throw new HttpException(
        {
          statusCode: HttpStatus.NOT_FOUND,
          message: ['Please enter id'],
        },
        HttpStatus.NOT_FOUND,
      );
    }
    const notificationQuery = `select * from t_user_notifications where user_id = '${userId}' AND read_status ='Unread'`;
    const userNotification = await this.dbConnection.query(notificationQuery);

    return {
      statusCode: HttpStatus.FOUND,
      message: 'Unread notifications count',
      data: userNotification.length,
    };
  }
}
