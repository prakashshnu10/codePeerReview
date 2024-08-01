import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { getConstantValue } from '../helper/dbHelper';
import logger from '../helper/logger';
import { Connection } from 'typeorm';
import { format } from 'date-fns';
enum RewardType {
  INDIRECTSALES = 'IndirectSales',
  DIRECTSALES = 'DirectSales',
  ONETIMEBONUS = 'OneTimeBonus',
}

enum Crypto {
  USDT = 'USDT',
  ETH = 'ETH',
}

enum DistributionStatus {
  PENDING = 'Pending',
  DISBURSED = 'Disbursed',
}

@Injectable()
export class RewardService {
  constructor(private readonly dbConnection: Connection) {}

  async getUserRewardEarnings(userId: string) {
    try {
      logger.info('getUserRewardEarnings::API');
      const userIdValue = await getConstantValue(this.dbConnection, 'user_id');
      const userQuery = `SELECT * FROM public.get_user('${userIdValue}', $1)`;
      const userDetails = await this.dbConnection.query(userQuery, [userId]);
      if (userDetails.length < 1) {
        throw new HttpException(
          {
            statusCode: HttpStatus.NOT_FOUND,
            message: ['No user found'],
          },
          HttpStatus.NOT_FOUND,
        );
      }

      const query = ` SELECT * FROM get_user_nft_reward('${userIdValue}', $1)`;
      const userRewards = await this.dbConnection.query(query, [userId]);

      logger.info('userRewards', userRewards);

      const bonusHistory = await this.userBonus(userId);

      if (bonusHistory.length < 1) {
        if (userRewards.length < 1) {
          throw new HttpException(
            {
              statusCode: HttpStatus.NOT_FOUND,
              message: ['No transaction found'],
            },
            HttpStatus.NOT_FOUND,
          );
        }
      }
      let res = [];
      for (let i = 0; i < userRewards.length; i++) {
        const element = userRewards[i];
        const fromUserQuery = `SELECT * FROM public.get_user('${userIdValue}', '${element.from_user_id}')`;
        const fromUser = await this.dbConnection.query(fromUserQuery);
        const parentUserQuery = `SELECT * FROM public.get_user('${userIdValue}', '${fromUser[0].referred_by_user_id}')`;
        const parent = await this.dbConnection.query(parentUserQuery);
        const rewardLevelIdValue = await getConstantValue(
          this.dbConnection,
          'reward_level_id',
        );
        const rewardLevelQuery = `SELECT * FROM public.get_reward_level('${rewardLevelIdValue}', '${element.referral_level_id}')`;
        await this.dbConnection.query(rewardLevelQuery);
        const rewardDistributionStatus = userRewards[i].reward_distributed;
        let rewardDistribution;
        const rewardMessage = userRewards[i].message;
        if (!rewardDistributionStatus) {
          rewardDistribution = DistributionStatus.PENDING;
        } else {
          rewardDistribution = DistributionStatus.DISBURSED;
        }

        const rewardDateAndTime = userRewards[i].updated_at;
        logger.info('rewardDateAndTime', rewardDateAndTime);
        const formattedDateTime = format(
          rewardDateAndTime,
          'yyyy-MM-dd h:mm a',
        );
        logger.info('formattedDateTime', formattedDateTime);
        let typeOfReward;
        const gettingTypeOfReward = userRewards[i].eligible_for_direct_sales;
        if (gettingTypeOfReward == false) {
          typeOfReward = RewardType.INDIRECTSALES;
        } else {
          typeOfReward = RewardType.DIRECTSALES;
        }

        const txnHash = userRewards[i].trx_hash;
        logger.info('txnHash', txnHash);

        const obj = {
          from: fromUser[0].first_name,
          level: fromUser[0].level,
          parent: parent[0].first_name,
          myEarning: parseFloat(element.reward_amount).toFixed(6),
          rewardStatus: rewardDistribution,
          typeOfSale: typeOfReward,
          dateAndTime: formattedDateTime,
          transactionHash: txnHash,
          crypto: Crypto.ETH,
        };
        res.push(obj);
      }

      let totalPendingRewardEarnings = 0;
      let totalPendingBonusEarning = 0;

      res.forEach((entry) => {
        if (
          (entry.typeOfSale === RewardType.INDIRECTSALES ||
            entry.typeOfSale === RewardType.DIRECTSALES) &&
          entry.rewardStatus === DistributionStatus.PENDING
        ) {
          totalPendingRewardEarnings += parseFloat(entry.myEarning);
        }
      });

      if (bonusHistory !== 'No bonus history') {
        res = res.concat(bonusHistory);
      }
      res.forEach((bonus) => {
        if (
          bonus.typeOfSale === RewardType.ONETIMEBONUS &&
          bonus.rewardStatus === DistributionStatus.PENDING
        ) {
          totalPendingBonusEarning += parseFloat(bonus.myEarning);
        }
      });

      if (bonusHistory === 'No bonus history') {
        return {
          data: res,
          totalPendingRewardEarnings: `${totalPendingRewardEarnings.toFixed(
            6,
          )}`,
          totalPendingBonusEarning: `${totalPendingBonusEarning}`,
        };
      }

      return {
        data: res,
        totalPendingRewardEarnings: `${totalPendingRewardEarnings.toFixed(6)}`,
        totalPendingBonusEarning: `${totalPendingBonusEarning}`,
      };
    } catch (error) {
      logger.error('getUserRewardEarnings::error', error);
      throw error;
    }
  }

  async userBonus(userId: string) {
    const queryToGetDetalilsForbadges = `SELECT * FROM t_user_badges WHERE user_id = '${userId}'`;
    const userBonus = await this.dbConnection.query(
      queryToGetDetalilsForbadges,
    );
    logger.info('userBonus', userBonus);
    if (userBonus.length < 1) {
      return 'No bonus history';
    }
    const result = [];
    for (let i = 0; i < userBonus.length; i++) {
      const dateAndTimeForBonus = userBonus[i].updated_at;
      const formattedDateTime = format(
        dateAndTimeForBonus,
        'yyyy-MM-dd h:mm a',
      );
      const trx_hash = userBonus[i].trx_hash;
      const type = RewardType.ONETIMEBONUS;
      const bonus = userBonus[i].user_bonus_amount;
      const bonusDistributed = userBonus[i].bonus_distributed;
      let bonusDistribution;
      if (!bonusDistributed) {
        bonusDistribution = DistributionStatus.PENDING;
      } else {
        bonusDistribution = DistributionStatus.DISBURSED;
      }
      const obj = {
        dateAndTime: formattedDateTime,
        transactionHash: trx_hash,
        typeOfSale: type,
        myEarning: bonus,
        crypto: Crypto.USDT,
        rewardStatus: bonusDistribution,
      };
      result.push(obj);
    }
    return result;
  }

  arraygroupBy(arr, property) {
    return arr.reduce(function (memo, x) {
      if (!memo[x[property]]) {
        memo[x[property]] = [];
      }
      memo[x[property]].push(x);

      return memo;
    }, {});
  }

  async getRewardStructure(userId: string) {
    try {
      logger.info('getRewardStructure');
      const userIdValue = await getConstantValue(this.dbConnection, 'user_id');
      const userQuery = `SELECT * FROM public.get_user('${userIdValue}', $1)`;
      const userDetails = await this.dbConnection.query(userQuery, [userId]);
      const response = [];
      if (userDetails.length < 1) {
        throw new HttpException(
          {
            statusCode: HttpStatus.NOT_FOUND,
            message: ['No user found'],
          },
          HttpStatus.NOT_FOUND,
        );
      }
      const queryResult = await this.dbConnection.query(`
    SELECT * FROM get_lowtier_users('${userId}')
     `);

      const groupedByRefId = this.arraygroupBy(
        queryResult,
        'referred_by_user_id',
      );
      const ids: any[] = Object.keys(groupedByRefId);
      const values: any[] = Object.values(groupedByRefId);
      for (let i = 0; i < ids.length; i++) {
        const childValues = values[i];
        for (let x = 0; x < childValues.length; x++) {
          const element = childValues[x];
          const childUserQuery = `SELECT * FROM public.get_user('${userIdValue}', $1)`;
          const childUserDetails = await this.dbConnection.query(
            childUserQuery,
            [element.user_id],
          );
          let childuserRewards = [];
          let childuserDirectRewards = [];
          let theirChildsEarning = [];

          if (userId == element.user_id) {
            const query = ` SELECT * FROM get_user_nft_indirect_reward('${userIdValue}', $1)`;

            childuserRewards = await this.dbConnection.query(query, [
              element.user_id,
            ]);
          } else {
            const query =
              'select * from get_from_user_nft_indirect_reward($1, $2)';
            childuserRewards = await this.dbConnection.query(query, [
              element.user_id,
              userId,
            ]);
          }

          if (userId == element.user_id) {
            const query = ` SELECT * FROM get_user_nft_direct_reward('${userIdValue}', $1)`;

            childuserDirectRewards = await this.dbConnection.query(query, [
              element.user_id,
            ]);
          } else {
            const query =
              'select * from get_from_user_nft_direct_reward($1, $2)';
            childuserDirectRewards = await this.dbConnection.query(query, [
              element.user_id,
              userId,
            ]);
          }

          if (element.user_id == element.user_id) {
            const query = ` SELECT * FROM get_user_nft_reward('${userIdValue}', $1)`;

            theirChildsEarning = await this.dbConnection.query(query, [
              element.user_id,
            ]);
          } else {
            const query = 'select * from get_from_user_nft_reward($1, $2)';
            theirChildsEarning = await this.dbConnection.query(query, [
              element.user_id,
              element.user_id,
            ]);
          }

          const referUserIdValue = await getConstantValue(
            this.dbConnection,
            'referred_by_user_id',
          );
          const userReferralQuery = `SELECT * FROM public.get_user('${referUserIdValue}', '${[
            childUserDetails[0].user_id,
          ]}')`;
          const childreferredByUserDetails = await this.dbConnection.query(
            userReferralQuery,
          );
          const childuserTotalReward = childuserRewards.reduce(
            (accumulator, object) => {
              return (
                Number(accumulator) + Number(object.reward_amount)
              ).toFixed(6);
            },
            0,
          );
          const childuserTotalDirectReward = childuserDirectRewards.reduce(
            (accumulator, object) => {
              return (
                Number(accumulator) + Number(object.reward_amount)
              ).toFixed(6);
            },
            0,
          );

          const thierChilduserRewardEarning = theirChildsEarning.reduce(
            (accumulator, object) => {
              return (
                Number(accumulator) + Number(object.reward_amount)
              ).toFixed(6);
            },
            0,
          );

          const nftPurchased = `select * from t_user_nft where user_id = '${childUserDetails[0].user_id}'`;
          const nftPurchaseCounts = await this.dbConnection.query(nftPurchased);

          // eslint-disable-next-line @typescript-eslint/naming-convention
          const res_child = {
            myId: childUserDetails[0].user_id,
            name: childUserDetails[0].first_name,
            referrals: childreferredByUserDetails.length,
            referredByUserDetails: ids[i],
            myEarning: childuserTotalReward,
            myDirectEarning: childuserTotalDirectReward,
            theirChildsEarning: thierChilduserRewardEarning,
            tier: [],
            level: element.level,
            email: childUserDetails[0].email,
            nftPurchasedCount: nftPurchaseCounts.length,
          };
          response.push(res_child);
        }
      }
      const output = this.convertData(response);
      const result = this.calculateNftSoldAndChildsEarning(output[0]);
      return result;
    } catch (error) {
      logger.error('getRewardStructure::error', error);
      throw error;
    }
  }

  convertData(data) {
    const userMap = {};
    const topLevelUsers = [];
    for (const user of data) {
      user.tier = [];
      userMap[user.myId] = user;
    }
    for (const user of data) {
      const referredByUserId = user.referredByUserDetails;
      if (referredByUserId && userMap[referredByUserId]) {
        userMap[referredByUserId].tier.push(user);
      } else {
        topLevelUsers.push(user);
      }
    }
    return topLevelUsers;
  }

  calculateNftSoldAndChildsEarning = (node) => {
    let nftSold = 0;
    let childsEarning = 0;

    if (node.tier.length === 0) {
      node.nftSold = nftSold;
      node.childsEarning = childsEarning;
      return node;
    }

    for (const tierNode of node.tier) {
      const { nftPurchasedCount, myEarning } = tierNode;
      const childResult = this.calculateNftSoldAndChildsEarning(tierNode);
      nftSold += nftPurchasedCount + childResult.nftSold;
      childsEarning += parseFloat(myEarning) + childResult.childsEarning;
    }

    node.nftSold = nftSold;
    node.childsEarning = childsEarning;
    return node;
  };

  async getTotalReferralsOfUserById(userId: string): Promise<any> {
    try {
      logger.info('getTotalReferralsOfUserById');
      const query = `SELECT * FROM m_users where referred_by_user_id = '${userId}'`;
      const user = await this.dbConnection.query(query);
      const lowtierquery = `SELECT * FROM get_lowtier_users('${userId}')`;
      const lowTieruser = await this.dbConnection.query(lowtierquery);
      const userQuery = `select * from t_user_badges where user_id = '${userId}'`;
      const userBadges = await this.dbConnection.query(userQuery);
      const totalBonusAmount = userBadges.reduce(
        (total, badge) => total + parseInt(badge.user_bonus_amount, 10),
        0,
      );

      return {
        totalReferrals: lowTieruser.length - 1,
        totalIndirectReferrals: lowTieruser.length - 1 - user.length,
        totalDirectReferrals: user.length,
        bonus: {
          totalBonusAmount: totalBonusAmount,
          message: 'One-Time Bonus',
        },
      };
    } catch (error) {
      logger.error('getTotalReferralsOfUserById::error', error);
      throw error;
    }
  }
}
