import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Connection } from 'typeorm';
import { getConstantValue } from '../helper/dbHelper';
import logger from '../helper/logger';
import { delay } from '../helper/delay';
@Injectable()
export class DirectSaleRewardService {
  constructor(private readonly dbConnection: Connection) {}

  async calculateDirectRewardDistribution(): Promise<any> {
    logger.info(
      'calculateDirectRewardDistribution::direct reward distribution',
    );
    try {
      await delay(3000);
      const query = `
      select * from get_unprocessed_direct_sale()`;
      const result = await this.dbConnection.query(query);
      logger.info('resultData===========>', result);
      if (result.length > 0) {
        const queryData = 'select * from get_immediate_hightier_users($1)';
        const userValue = [];
        let userId;
        for (const item of result) {
          userId = item.user_id;
          const resultData = await this.dbConnection.query(queryData, [userId]);
          logger.info('resultData', resultData);
          if (resultData.length > 0) {
            for (let i = 0; i < resultData.length; i++) {
              const createQuery = `CALL public.post_user_nft_reward(
              $1, $2, $3, $4, $5, $6, $7, $8)`;
              const rewardAmount =
                (item.nft_price * resultData[i].reward_perc) / 100;
              const calculatedRewardAmount =
                rewardAmount.toString().split('.')[0] +
                '.' +
                rewardAmount.toString().split('.')[1].slice(0, 6);
              const userObj = await this.dbConnection.query(createQuery, [
                resultData[i].user_id,
                userId,
                item.nft_id,
                resultData[i].reward_id,
                resultData[i].reward_direct_sales,
                calculatedRewardAmount,
                true,
                null,
              ]);
              const directSaleValue = await getConstantValue(
                this.dbConnection,
                'direct_sale',
              );
              const updateQuery = `CALL put_user_nft_by_trx_id('{"${directSaleValue}": true}'::jsonb, '${item.trx_id}' )`;
              await this.dbConnection.query(updateQuery);
            }
          }
        }
        return userValue;
      }
    } catch (error) {
      logger.error('calculateDirectRewardDistribution::error', error);
      throw error;
    }
  }
}
