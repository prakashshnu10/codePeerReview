import { Injectable } from '@nestjs/common';
import logger from '../helper/logger';
import {
  successLockedMessage,
  successUnlockedMessage,
} from 'src/helper/message';
import { Connection } from 'typeorm';

@Injectable()
export class BadgesService {
  constructor(private readonly dbConnection: Connection) {}

  async getBadgeDistributionById(userId: string): Promise<any> {
    try {
      logger.info('getBadgeDistributionById');
      const query = `select * from get_user_badges_and_criteria('${userId}')`;
      const user = await this.dbConnection.query(query);
      const badgeLockedStatus = successLockedMessage.badgeArray;
      const badgeUnlockedStatus = successUnlockedMessage.badgeArray;
      const responseData = [...user];
      const badgeAdvisor = [
        'Elite Member',
        'Bronze Member',
        'Silver Member',
        'Gold Member',
        'Senior Member',
        'Executive Member',
      ];

      const badgeAdvisorBonus = [
        '250',
        '1000',
        '2500',
        '10000',
        '25000',
        '50000',
      ];
      // Iterate through the badges and check if they exist in the user array
      for (const badge of badgeAdvisor) {
        const index = badgeAdvisor.indexOf(badge);
        if (!responseData.some((value) => value.badge === badge)) {
          const queryToGetBadgeImage = `SELECT image FROM m_badges WHERE badge = '${badge}'`;
          const getBadgeImage = await this.dbConnection.query(queryToGetBadgeImage);
          responseData.push({
            user_badge_id: null,
            user_id: `${userId}`,
            badge_id: null,
            user_bonus: null,
            trx_hash: null,
            badge: badge,
            badgeImage: getBadgeImage[0].image,
            min_nft_criteria: null,
            badge_bonus: badgeAdvisorBonus[index], // Assign the corresponding bonus from badgeAdvisorBonus
          });
        }
      }

      const updatedResponseData = responseData.map((dataItem) => {
        if (dataItem.badge_id !== null && dataItem.user_bonus !== null) {
          // If both badge_id and user_bonus are not null, set status to "Unlocked" and construct the message.
          const matchingBadgeStatus = badgeUnlockedStatus.find(
            (badgeItem) => badgeItem.badge === dataItem.badge,
          );
          if (matchingBadgeStatus) {
            return {
              ...dataItem,
              status: 'Unlocked',
              message: `${matchingBadgeStatus.message}`,
            };
          } else {
            return {
              ...dataItem,
              status: 'Unlocked',
              message: 'Badge status not found',
            };
          }
        } else {
          // If either badge_id or user_bonus is null, set status to "Locked" and construct the message.
          const matchingBadgeStatus = badgeLockedStatus.find(
            (badgeItem) => badgeItem.badge === dataItem.badge,
          );
          if (matchingBadgeStatus) {
            return {
              ...dataItem,
              status: 'Locked',
              badge: dataItem.badge,
              message: `${matchingBadgeStatus.message}`,
            };
          } else {
            // If badge is null but status is locked, set a default message.
            return {
              ...dataItem,
              status: 'Locked',
              badge: null,
              message: 'Badge status is locked',
            };
          }
        }
      });
      updatedResponseData.sort(
        (a, b) => parseInt(a.min_nft_criteria) - parseInt(b.min_nft_criteria),
      );
      const data = {
        responseData: updatedResponseData,
        badgeLevel: 'Elite Member',
        badgeImage: '',
      };

      let maxMinNftCriteria = 0;
      let badgeLevel = null;

      for (const entry of data.responseData) {
        const minNftCriteria = parseInt(entry.min_nft_criteria);
        if (minNftCriteria > maxMinNftCriteria) {
          maxMinNftCriteria = minNftCriteria;
          badgeLevel = entry.badge;
        }
      }

      if(badgeLevel === null){
        const queryToGetBadgeImage = `SELECT image FROM m_badges WHERE badge = 'Elite Member'`;
        const getBadgeImage = await this.dbConnection.query(queryToGetBadgeImage);
        data.badgeImage = getBadgeImage[0].image;
      }else{
        const queryToGetBadgeImage = `SELECT image FROM m_badges WHERE badge = '${badgeLevel}'`;
        const getBadgeImage = await this.dbConnection.query(queryToGetBadgeImage);
        data.badgeImage = getBadgeImage[0].image;
      }

      data.badgeLevel = badgeLevel;
      return data;
    } catch (error) {
      logger.error('Get Badges By Id::error', error);
      throw error;
    }
  }
}
