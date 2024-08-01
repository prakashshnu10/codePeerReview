/* eslint-disable prettier/prettier */
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';
import { getConstantValue } from 'src/helper/dbHelper';
import { delay } from 'src/helper/delay';
import logger from 'src/helper/logger';
import { EmailService } from 'src/otp/services/email.service';
import { Connection } from 'typeorm';

@Injectable()
export class EmailNotificationService {
  constructor(
    private readonly dbConnection: Connection,
    private emailService: EmailService,
  ) {}

  //  @Cron(CronExpression.EVERY_MINUTE)
  async directSalesRewardDue(): Promise<any> {
    try {
      logger.info('directSalesRewardDue');
      await delay(3000);
      const rewardQuery =
        'select * from get_all_direct_reward_due_notification()';
      const users = await this.dbConnection.query(rewardQuery);
      const userConstantValue = await getConstantValue(
        this.dbConnection,
        'user_id',
      );
      if (users.length > 0) {
        for (const user of users) {
          const query = `SELECT * FROM public.get_user('${userConstantValue}', '${user.user_id}')`;
          const userEmail = await this.dbConnection.query(query);

          const fromUser = `SELECT * FROM public.get_user('${userConstantValue}', '${user.from_user_id}')`;
          const fromUserEmail = await this.dbConnection.query(fromUser);

          // Insert data into t_user_notifications
          const insertNotificationQuery = `CALL public.post_user_notification(
            $1, $2, $3, $4, $5, $6, $7, $8, $9)`;
          await this.dbConnection.query(insertNotificationQuery, [
            user.user_id,
            user.id,
            null,
            null,
            'Direct sales',
            'Pending',
            null,
            'Unread',
            null,
          ]);
          const rewardNotificationConstant = await getConstantValue(
            this.dbConnection,
            'notification',
          );

          const queryToPutNotificationStatus = `CALL put_user_nft_reward_by_id('{"${rewardNotificationConstant}": true}'::jsonb, '${user.id}' )`;
          logger.info(
            `queryToPutNotificationStatus::::::::: ${queryToPutNotificationStatus}`,
          );
          const updateRewardNotification = await this.dbConnection.query(
            queryToPutNotificationStatus,
          );
          logger.info(
            `updateRewardNotification::::::::::: ${updateRewardNotification}`,
          );

          // Send an email
          await this.emailService.sendMailToDirectSalesRewardDue(
            userEmail[0].email,
            fromUserEmail[0].email,
            fromUserEmail[0].first_name,
            user.reward_amount,
          );
          logger.info('Email sent to user');
        }
      }
    } catch (error) {
      logger.error('directSalesRewardDue:::error', error);
      throw error;
    }
  }

  // @Cron(CronExpression.EVERY_MINUTE)
  async directSalesRewardRecived(): Promise<any> {
    try {
      logger.info('directSalesRewardRecived');
      await delay(3000);
      const rewardQuery = `
      select * from get_all_direct_reward_received_notification()
    `;
      const users = await this.dbConnection.query(rewardQuery);
      const userConstantValue = await getConstantValue(
        this.dbConnection,
        'user_id',
      );
      if (users.length > 0) {
        for (const user of users) {
          const query = `SELECT * FROM public.get_user('${userConstantValue}', '${user.user_id}')`;
          const userEmail = await this.dbConnection.query(query);

          const fromUser = `SELECT * FROM public.get_user('${userConstantValue}', '${user.from_user_id}')`;
          const fromUserEmail = await this.dbConnection.query(fromUser);

          // Insert data into t_user_notifications
          const insertNotificationQuery = `CALL public.post_user_notification(
            $1, $2, $3, $4, $5, $6, $7, $8, $9)`;
          await this.dbConnection.query(insertNotificationQuery, [
            user.user_id,
            user.id,
            null,
            null,
            'Direct sales',
            'Distributed',
            null,
            'Unread',
            null,
          ]);
          const rewardNotificationConstant = await getConstantValue(
            this.dbConnection,
            'notification',
          );

          const queryToPutNotificationStatus = `CALL put_user_nft_reward_by_id('{"${rewardNotificationConstant}": true}'::jsonb, '${user.id}' )`;
          logger.info(
            `queryToPutNotificationStatus: ${queryToPutNotificationStatus}`,
          );
          const updateRewardNotification = await this.dbConnection.query(
            queryToPutNotificationStatus,
          );
          logger.info(`updateRewardNotification: ${updateRewardNotification}`);

          // Send an email
          await this.emailService.sendMailToDirectSalesRewardReceived(
            userEmail[0].email,
            fromUserEmail[0].email,
            fromUserEmail[0].first_name,
            user.reward_amount,
          );
          logger.info('Email sent to user');
        }
      }
    } catch (error) {
      logger.error('directSalesRewardRecived:::error', error);
      throw error;
    }
  }

  // @Cron(CronExpression.EVERY_MINUTE)
  async indirectSalesRewardDue(): Promise<any> {
    try {
      logger.info('indirectSalesRewardDue');
      await delay(3000);
      const rewardQuery = `
      select * from get_all_indirect_reward_due_notification()
          `;
      const users = await this.dbConnection.query(rewardQuery);
      const userConstantValue = await getConstantValue(
        this.dbConnection,
        'user_id',
      );
      if (users.length > 0) {
        for (const user of users) {
          const query = `SELECT * FROM public.get_user('${userConstantValue}', '${user.user_id}')`;
          const userEmail = await this.dbConnection.query(query);

          const fromUser = `SELECT * FROM public.get_user('${userConstantValue}', '${user.from_user_id}')`;
          const fromUserEmail = await this.dbConnection.query(fromUser);

          // Insert data into t_user_notifications
          const insertNotificationQuery = `CALL public.post_user_notification(
            $1, $2, $3, $4, $5, $6, $7, $8, $9)`;
          await this.dbConnection.query(insertNotificationQuery, [
            user.user_id,
            user.id,
            null,
            null,
            'Indirect sales',
            'Pending',
            null,
            'Unread',
            null,
          ]);
          const rewardNotificationConstant = await getConstantValue(
            this.dbConnection,
            'notification',
          );

          const queryToPutNotificationStatus = `CALL put_user_nft_reward_by_id('{"${rewardNotificationConstant}": true}'::jsonb, '${user.id}' )`;
          logger.info(
            `queryToPutNotificationStatus::::::::: ${queryToPutNotificationStatus}`,
          );
          const updateRewardNotification = await this.dbConnection.query(
            queryToPutNotificationStatus,
          );
          logger.info(
            `updateRewardNotification::::::::::: ${updateRewardNotification}`,
          );

          // Send an email
          await this.emailService.sendMailToIndirectSalesRewardDue(
            userEmail[0].email,
            fromUserEmail[0].email,
            fromUserEmail[0].level,
            fromUserEmail[0].first_name,
            user.reward_amount,
          );
          logger.info('Email sent to user');
        }
      }
    } catch (error) {
      logger.error('indirectSalesRewardDue:::error', error);
      throw error;
    }
  }

  // @Cron(CronExpression.EVERY_MINUTE)
  async indirectSalesRewardReceived(): Promise<any> {
    try {
      logger.info('indirectSalesRewardReceived');
      await delay(3000);
      const rewardQuery = `
            SELECT * FROM get_all_indirect_reward_received_notification()
          `;
      const users = await this.dbConnection.query(rewardQuery);
      const userConstantValue = await getConstantValue(
        this.dbConnection,
        'user_id',
      );
      if (users.length > 0) {
        for (const user of users) {
          const query = `SELECT * FROM public.get_user('${userConstantValue}', '${user.user_id}')`;
          const userEmail = await this.dbConnection.query(query);

          const fromUser = `SELECT * FROM public.get_user('${userConstantValue}', '${user.from_user_id}')`;
          const fromUserEmail = await this.dbConnection.query(fromUser);
          // Insert data into t_user_notifications
          const insertNotificationQuery = `CALL public.post_user_notification(
            $1, $2, $3, $4, $5, $6, $7, $8, $9)`;
          await this.dbConnection.query(insertNotificationQuery, [
            user.user_id,
            user.id,
            null,
            null,
            'Indirect sales',
            'Distributed',
            null,
            'Unread',
            null,
          ]);
          const rewardNotificationConstant = await getConstantValue(
            this.dbConnection,
            'notification',
          );

          const queryToPutNotificationStatus = `CALL put_user_nft_reward_by_id('{"${rewardNotificationConstant}": true}'::jsonb, '${user.id}' )`;
          logger.info(
            `queryToPutNotificationStatus::::::::: ${queryToPutNotificationStatus}`,
          );
          const updateRewardNotification = await this.dbConnection.query(
            queryToPutNotificationStatus,
          );
          logger.info(
            `updateRewardNotification::::::::::: ${updateRewardNotification}`,
          );

          // Send an email
          await this.emailService.sendMailToIndirectSalesRewardReceived(
            userEmail[0].email,
            fromUserEmail[0].email,
            fromUserEmail[0].first_name,
            user.reward_amount,
          );
          logger.info('Email sent to user');
        }
      }
    } catch (error) {
      logger.error('indirectSalesRewardReceived:::error', error);
      throw error;
    }
  }

  // @Cron(CronExpression.EVERY_MINUTE)
  async BonusDue(): Promise<any> {
    try {
      logger.info('bonusDue');
      await delay(3000);
      const bonusQuery = `
      select * from get_all_bonus_due_notification()
      `;
      const users = await this.dbConnection.query(bonusQuery);
      const userConstantValue = await getConstantValue(
        this.dbConnection,
        'user_id',
      );
      const badgeConstantValue = await getConstantValue(
        this.dbConnection,
        'badge_id',
      );
      if (users.length > 0) {
        for (const user of users) {
          const query = `SELECT * FROM public.get_user('${userConstantValue}','${user.user_id}')`;
          const userEmail = await this.dbConnection.query(query);
          const badge = `select * from get_badge_by_id('${badgeConstantValue}', '${user.badge_id}')`;
          const badgeData = await this.dbConnection.query(badge);
          // Insert data into t_user_notifications
          const insertNotificationQuery = `CALL public.post_user_notification(
            $1, $2, $3, $4, $5, $6, $7, $8, $9)`;
          await this.dbConnection.query(insertNotificationQuery, [
            user.user_id,
            null,
            user.id,
            null,
            'Badge bonus',
            null,
            'Pending',
            'Unread',
            null,
          ]);
          const rewardNotificationConstant = await getConstantValue(
            this.dbConnection,
            'notification',
          );

          const queryToPutNotificationStatus = `CALL put_user_badge_status_by_id('{"${rewardNotificationConstant}": true}'::jsonb, '${user.id}' )`;
          logger.info(
            `queryToPutNotificationStatus::::::::: ${queryToPutNotificationStatus}`,
          );
          const updateRewardNotification = await this.dbConnection.query(
            queryToPutNotificationStatus,
          );
          logger.info(
            `updateRewardNotification::::::::::: ${updateRewardNotification}`,
          );

          // Send an email
          await this.emailService.sendMailToOneTimeBonusDue(
            userEmail[0].email,
            badgeData[0].badge,
            badgeData[0].min_nft_criteria,
            user.user_bonus_amount,
          );
          logger.info('Email sent to user');
        }
      }
    } catch (error) {
      logger.error('BonusDue:::error', error);
      throw error;
    }
  }

  // @Cron(CronExpression.EVERY_MINUTE)
  async BonusReceived(): Promise<any> {
    try {
      logger.info('bonusReceived');
      await delay(3000);
      const bonusQuery = `
      select * from get_all_bonus_received_notification()
      `;
      const users = await this.dbConnection.query(bonusQuery);
      const userConstantValue = await getConstantValue(
        this.dbConnection,
        'user_id',
      );
      const badgeConstantValue = await getConstantValue(
        this.dbConnection,
        'badge_id',
      );
      if (users.length > 0) {
        for (const user of users) {
          const query = `SELECT * FROM public.get_user('${userConstantValue}', '${user.user_id}')`;
          const userEmail = await this.dbConnection.query(query);
          const badge = `select * from get_badge_by_id('${badgeConstantValue}', '${user.badge_id}')`;
          console.log('badge', badge);
          const badgeData = await this.dbConnection.query(badge);

          console.log('badgeData', badgeData);

          // Insert data into t_user_notifications
          const insertNotificationQuery = `CALL public.post_user_notification(
            $1, $2, $3, $4, $5, $6, $7, $8, $9)`;
          await this.dbConnection.query(insertNotificationQuery, [
            user.user_id,
            null,
            user.id,
            null,
            'Badge bonus',
            null,
            'Distributed',
            'Unread',
            null,
          ]);
          const rewardNotificationConstant = await getConstantValue(
            this.dbConnection,
            'notification',
          );

          const queryToPutNotificationStatus = `CALL put_user_badge_status_by_id('{"${rewardNotificationConstant}": true}'::jsonb, '${user.id}' )`;
          logger.info(
            `queryToPutNotificationStatus::::::::: ${queryToPutNotificationStatus}`,
          );
          const updateRewardNotification = await this.dbConnection.query(
            queryToPutNotificationStatus,
          );
          logger.info(
            `updateRewardNotification::::::::::: ${updateRewardNotification}`,
          );

          // Send an email
          await this.emailService.sendMailToOneTimeBonusReceived(
            userEmail[0].email,
            badgeData[0].badge,
            badgeData[0].min_nft_criteria,
            user.user_bonus_amount,
          );
          logger.info('Email sent to user');
        }
      }
    } catch (error) {
      logger.error('BonusReceived:::error', error);
      throw error;
    }
  }

  // @Cron(CronExpression.EVERY_10_SECONDS)
  async nftPurchased(): Promise<any> {
    try {
      logger.info('nftPurchased');
      await delay(3000);
      const rewardQuery = `
      select * from get_all_nft_purchased_notification()
          `;
      const users = await this.dbConnection.query(rewardQuery);
      const userConstantValue = await getConstantValue(
        this.dbConnection,
        'user_id',
      );
      const nftIdConstantValue = await getConstantValue(
        this.dbConnection,
        'nft_id',
      );
      if (users.length > 0) {
        for (const user of users) {
          const query = `SELECT * FROM public.get_user('${userConstantValue}', '${user.user_id}')`;
          const userEmail = await this.dbConnection.query(query);
          const nft = `select * from get_nft('${nftIdConstantValue}','${user.nft_id}')`;
          const nftDetails = await this.dbConnection.query(nft);

          // Insert data into t_user_notifications
          const insertNotificationQuery = `CALL public.post_user_notification(
            $1, $2, $3, $4, $5, $6, $7, $8, $9)`;
          await this.dbConnection.query(insertNotificationQuery, [
            user.user_id,
            null,
            null,
            user.trx_id,
            'Nft purchased',
            null,
            null,
            'Unread',
            null,
          ]);
          const rewardNotificationConstant = await getConstantValue(
            this.dbConnection,
            'notification',
          );

          const queryToPutNotificationStatus = `CALL put_user_nft_reward_by_id('{"${rewardNotificationConstant}": true}'::jsonb, '${user.trx_id}' )`;

          logger.info(
            `queryToPutNotificationStatus::::::::: ${queryToPutNotificationStatus}`,
          );
          const updateRewardNotification = await this.dbConnection.query(
            queryToPutNotificationStatus,
          );
          logger.info(
            `updateRewardNotification::::::::::: ${updateRewardNotification}`,
          );

          // Send an email
          await this.emailService.sendMailToNftPurchased(
            userEmail[0].email,
            nftDetails[0].title,
          );
          logger.info('Email sent to user');
        }
      }
    } catch (error) {
      logger.error('nftPurchased:::error', error);
      throw error;
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_10AM)
  async sendMailToRewardEarningDaily(): Promise<any> {
    try {
      logger.info('sendMailToRewardEarningDaily');

      const rewardQuery = `
      SELECT * FROM get_all_user_nft_reward() 
    `;
      const users = await this.dbConnection.query(rewardQuery);
      const uniqueUserIds = [...new Set(users.map((item) => item.user_id))];

      for (const user of uniqueUserIds) {
        const rewardEarning = await axios.get(
          `${process.env.BACKEND_URL}/reward/earnings/${user}`,
        );
        await delay(3000);
        const userConstantValue = await getConstantValue(
          this.dbConnection,
          'user_id',
        );
        const email = `SELECT * FROM public.get_user('${userConstantValue}', '${user}')`;
        const userData = await this.dbConnection.query(email);
        if (users.length > 0) {
          const currentEarning = rewardEarning.data.totalPendingRewardEarnings;
          if (parseFloat(currentEarning) > parseFloat('0.000000')) {
            await this.emailService.sendMailToDailyRewardEarning(
              userData[0].email,
              rewardEarning.data.totalPendingRewardEarnings,
            );
            logger.info('Email sent to user');
          }
        }
      }
    } catch (error) {
      logger.error('sendMailToRewardEarningDaily:::error', error);
      throw error;
    }
  }

  // @Cron(CronExpression.EVERY_MINUTE)
  async BonusUpgrade(): Promise<any> {
    try {
      logger.info('BonusUpgrade');
      await delay(3000);
      const bonusQuery = `
      select * from get_all_badges_upgrade_notification()`;
      const users = await this.dbConnection.query(bonusQuery);
      if (users.length > 0) {
        const userGroups = {};
        users.forEach((entry) => {
          const { user_id, badge_id, created_at, user_bonus_amount } = entry;

          if (!userGroups[user_id]) {
            userGroups[user_id] = [];
          }

          userGroups[user_id].push({ badge_id, created_at, user_bonus_amount });
        });

        // Calculate latest and previous user_bonus_amount for users with more than one entry
        const result = [];
        for (const user_id in userGroups) {
          if (userGroups[user_id].length > 1) {
            const userEntries = userGroups[user_id];

            // Sort user entries by created_at in descending order
            userEntries.sort((a, b) => {
              const dateA = new Date(a.created_at).getTime();
              const dateB = new Date(b.created_at).getTime();
              return dateB - dateA;
            });

            // Extract the latest and previous user_bonus_amount and badge_id
            const latestEntry = userEntries[0];
            const previousEntry = userEntries[1];

            result.push({
              user_id,
              latestAmount: latestEntry.user_bonus_amount,
              previousAmount: previousEntry
                ? previousEntry.user_bonus_amount
                : null,
              latestBadgeId: latestEntry.badge_id,
              previousBadgeId: previousEntry ? previousEntry.badge_id : null,
            });
          }
        }
        const userConstantValue = await getConstantValue(
          this.dbConnection,
          'user_id',
        );
        const badgeConstantValue = await getConstantValue(
          this.dbConnection,
          'badge_id',
        );
        for (const badgeName of result) {
          const userquery = `SELECT * FROM public.get_user('${userConstantValue}','${badgeName.user_id}')`;
          const userData = await this.dbConnection.query(userquery);
          const latestbadgeQuery = `select * from get_badge_by_id('${badgeConstantValue}', '${badgeName.latestBadgeId}')`;
          const latestBadgeName = await this.dbConnection.query(
            latestbadgeQuery,
          );
          const previousbadgeQuery = `select * from get_badge_by_id('${badgeConstantValue}', '${badgeName.previousBadgeId}')`;
          const previousBadgeName = await this.dbConnection.query(
            previousbadgeQuery,
          );

          // Send an email
          await this.emailService.sendMailToUpgradeOneTimeBonus(
            userData[0].email,
            previousBadgeName[0].badge,
            latestBadgeName[0].badge,
            badgeName.latestAmount,
          );
          logger.info('Email sent to user');
        }
      }
    } catch (error) {
      logger.error('BonusUpgrade:::error', error);
      throw error;
    }
  }
}
