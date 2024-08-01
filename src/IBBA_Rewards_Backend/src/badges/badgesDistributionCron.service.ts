import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { delay } from '../helper/delay';
import logger from '../helper/logger';
import { Connection, QueryFailedError } from 'typeorm';

@Injectable()
export class BadgesDistributionCronService {
  constructor(private readonly dbConnection: Connection) {}

  //@Cron(CronExpression.EVERY_MINUTE)
  async calculateBonusDistribution(): Promise<any> {
    try {
      logger.info('calculateBonusDistribution');
      await delay(3000);
      const query = 'select user_id from get_all_users()';
      const userId = await this.dbConnection.query(query);
      const badgeQuery = 'SELECT * from get_badges()';
      const badgeData = await this.dbConnection.query(badgeQuery);
      badgeData.sort(
        (max, min) =>
          parseInt(min.min_nft_criteria) - parseInt(max.min_nft_criteria),
      );

      for (const user of userId) {
        const badges = `select * from get_nft_purchased_by_low_tier('${user.user_id}')`;
        const results = await this.dbConnection.query(badges);

        if (results.length < 1) {
          throw new HttpException(
            {
              statusCode: HttpStatus.NOT_FOUND,
              message: ['No data found'],
            },
            HttpStatus.NOT_FOUND,
          );
        }

        function determineBadge(purchases) {
          for (const badge of badgeData) {
            if (parseInt(purchases) >= parseInt(badge.min_nft_criteria)) {
              return {
                badge: badge.badge,
                badgeId: badge.id,
                bonus_amount: badge.bonus_amount,
              };
            }
          }
          return null;
        }

        const output = results.map((result) => ({
          badge: determineBadge(result.get_nft_purchased_by_low_tier),
          userId: user.user_id,
        }));
        if (output.length < 1) {
          throw new HttpException(
            {
              statusCode: HttpStatus.NOT_FOUND,
              message: ['No data'],
            },
            HttpStatus.NOT_FOUND,
          );
        }

        try {
          if (output[0].badge != null) {
            const createQuery = `
              CALL post_user_badges($1, $2, $3, $4)
            `;
            await this.dbConnection.query(createQuery, [
              output[0].userId,
              output[0].badge.badgeId,
              output[0].badge.bonus_amount,
              null,
            ]);
          }
        } catch (error) {
          if (
            error instanceof QueryFailedError &&
            error.message.includes(
              'duplicate key value violates unique constraint',
            )
          ) {
            logger.error('Duplicate key error: Skipping insertion');
          } else {
            logger.error('An error occurred:', error);
            throw error;
          }
        }
      }
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        error.message.includes('duplicate key value violates unique constraint')
      ) {
        logger.error('Duplicate key error: Skipping insertion');
      } else {
        logger.error('An error occurred:', error);
        throw error;
      }
    }
  }
}
