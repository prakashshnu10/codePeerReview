import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Connection } from 'typeorm';
import { getConstantValue } from '../helper/dbHelper';
import logger from '../helper/logger';
import { delay } from '../helper/delay';
@Injectable()
export class RewardCronService {
  constructor(private readonly dbConnection: Connection) {}

  async calculateIndirectRewardDistribution(): Promise<any> {
    logger.info(
      'calculateIndirectRewardDistribution::indirect reward distribution',
    );
    try {
      await delay(3000);
      const query = `
      select * from get_unprocessed()`;
      const result = await this.dbConnection.query(query);
      logger.info('result of indrect sales', result);
      if (result.length > 0) {
        const queryData = 'select * from get_hightier_users_for_indirect_sales_reward($1)';
        const userValue = [];
        let userId;
        for (const item of result) {
          userId = item.user_id;
          logger.info('userId', userId);
          const resultData = await this.dbConnection.query(queryData, [userId]);
          logger.info('resultData', resultData);
          if (resultData.length > 0) {
            logger.info('resultData:::::', resultData);
            for (let i = 0; i < resultData.length; i++) {
              const createQuery = `CALL public.post_user_nft_reward(
              $1, $2, $3, $4, $5, $6, $7, $8)`;
              const rewardAmount =
                (item.nft_price * resultData[i].reward_perc) / 100;
              logger.info('rewardAmount', rewardAmount);
              const calculatedRewardAmount =
                rewardAmount.toString().split('.')[0] +
                '.' +
                rewardAmount.toString().split('.')[1].slice(0, 6);
              logger.info('calculatedRewardAmount', calculatedRewardAmount);
              const userObj = await this.dbConnection.query(createQuery, [
                resultData[i].user_id,
                userId,
                item.nft_id,
                resultData[i].reward_id,
                resultData[i].reward_level_id,
                calculatedRewardAmount,
                false,
                null,
              ]);

              userValue.push(userObj);
            }
          }

          const processedValue = await getConstantValue(
            this.dbConnection,
            'processed',
          );
          const updateQuery = `CALL put_user_nft_by_trx_id('{"${processedValue}": true}'::jsonb, '${item.trx_id}' )`;
          await this.dbConnection.query(updateQuery);

          if (userValue.length === 0) {
            logger.info('No data for reward calculation!');
          }
        }
        return userValue;
      }
    } catch (error) {
      logger.error(
        'calculateIndirectRewardDistribution:::indirect reward:::error',
        error,
      );
      throw error;
    }
  }
}
