import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Connection } from 'typeorm';
import { AdminLoginDto } from './dto/admin-pannel.dto';
import { JwtService } from '@nestjs/jwt';
import logger from '../helper/logger';
import { RewardPercentageDistributionDto } from './dto/rewardPercentageDistribution';
import { getConstantValue } from '../helper/dbHelper';
import { config } from 'dotenv';
config();

@Injectable()
export class AdminPanelService {
  constructor(
    private readonly dbConnection: Connection,
    private readonly jwtService: JwtService,
  ) {}

  async findUserByEmail(email: string): Promise<any> {
    try {
      logger.info('findUserByEmail');
      const dataValue = await getConstantValue(this.dbConnection, 'email');
      const query = `SELECT * FROM public.get_user('${dataValue}', '${email}')`;
      const user = await this.dbConnection.query(query);
      logger.info('user', user);
      if (user.length < 1) {
        throw new HttpException(
          {
            statusCode: HttpStatus.NOT_FOUND,
            message: ['Incorrect Email Id, User not found'],
          },
          HttpStatus.NOT_FOUND,
        );
      }
      const userId = user[0].user_id;

      const adminValue = await getConstantValue(this.dbConnection, 'admin');
      const userQuery = `SELECT * FROM public.get_user('${adminValue}', '${userId}')`;
      const userDetails = await this.dbConnection.query(userQuery);
      logger.info('userDetails', userDetails);
      if (userDetails.length < 1) {
        throw new HttpException(
          {
            statusCode: HttpStatus.NOT_FOUND,
            message: ['Incorrect Email Id'],
          },
          HttpStatus.NOT_FOUND,
        );
      }
      return user;
    } catch (e) {
      logger.error('findUserByEmail:::error', e);
      throw e;
    }
  }

  async adminLogin(
    adminLoginDto: AdminLoginDto,
  ): Promise<{ token: string; user: AdminLoginDto }> {
    try {
      logger.info('adminLogin');
      const { email, otp } = adminLoginDto;
      const dataValue = await getConstantValue(this.dbConnection, 'email');
      const query = `SELECT * FROM public.get_user('${dataValue}', '${email}')`;
      const user = await this.dbConnection.query(query);
      if (user.length < 1) {
        throw new HttpException(
          {
            statusCode: HttpStatus.NOT_FOUND,
            message: ['Incorrect Email Id, User not found'],
          },
          HttpStatus.NOT_FOUND,
        );
      }
      const userId = user[0].user_id;
      const adminValue = await getConstantValue(this.dbConnection, 'admin');
      const userQuery = `SELECT * FROM public.get_user('${adminValue}', '${userId}')`;
      const userDetails = await this.dbConnection.query(userQuery);
      if (userDetails.length < 1) {
        throw new HttpException(
          {
            statusCode: HttpStatus.NOT_FOUND,
            message: ['Invalid user id'],
          },
          HttpStatus.NOT_FOUND,
        );
      }
      if (otp !== user[0].otp) {
        throw new UnauthorizedException({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: ['Invalid otp'],
        });
      }
      const token = this.jwtService.sign({ user_id: user[0].user_id });
      return { user, token };
    } catch (error) {
      logger.error('adminLogin:::error', error);
      throw error;
    }
  }

  async getAllRewardLevel(userId: string): Promise<any> {
    try {
      logger.info('getAllRewardLevel');
      const dataValue = await getConstantValue(this.dbConnection, 'user_id');
      const query = `SELECT * FROM public.get_user('${dataValue}', '${userId}')`;
      const user = await this.dbConnection.query(query);
      if (user.length < 1) {
        throw new HttpException(
          {
            statusCode: HttpStatus.NOT_FOUND,
            message: ['No user found'],
          },
          HttpStatus.NOT_FOUND,
        );
      }

      const adminUserId = user[0].user_id;
      const adminValue = await getConstantValue(this.dbConnection, 'admin');
      const adminQuery = `SELECT * FROM public.get_user('${adminValue}', '${adminUserId}')`;
      const adminDetails = await this.dbConnection.query(adminQuery);
      if (adminDetails.length < 1) {
        throw new HttpException(
          {
            statusCode: HttpStatus.NOT_FOUND,
            message: ['Incorrect User Id'],
          },
          HttpStatus.NOT_FOUND,
        );
      }

      const rewardLevelQuery = 'select * from get_all_reward_level()';
      const rewardLevel = await this.dbConnection.query(rewardLevelQuery);
      return rewardLevel;
    } catch (error) {
      logger.error('getAllRewardLevel:::error', error);
      throw error;
    }
  }

  async updateRewardPercentage(
    userId: string,
    rewardPercentageDistributionDto: RewardPercentageDistributionDto,
  ): Promise<any> {
    try {
      logger.info('updateRewardPercentage');
      const dataValue = await getConstantValue(this.dbConnection, 'user_id');
      const query = `SELECT * FROM public.get_user('${dataValue}', '${userId}')`;
      const user = await this.dbConnection.query(query);
      if (user.length < 1) {
        throw new HttpException(
          {
            statusCode: HttpStatus.NOT_FOUND,
            message: ['No user found'],
          },
          HttpStatus.NOT_FOUND,
        );
      }

      const adminUserId = user[0].user_id;
      const adminValue = await getConstantValue(this.dbConnection, 'admin');
      const adminQuery = `SELECT * FROM public.get_user('${adminValue}', '${adminUserId}')`;
      const adminDetails = await this.dbConnection.query(adminQuery);
      if (adminDetails.length < 1) {
        throw new HttpException(
          {
            statusCode: HttpStatus.NOT_FOUND,
            message: ['Incorrect User Id'],
          },
          HttpStatus.NOT_FOUND,
        );
      }

      const LevelQuery = 'select * from get_all_reward_level()';
      const getAllrewardLevel = await this.dbConnection.query(LevelQuery);

      for (
        let rewardLevel = 0;
        rewardLevel < rewardPercentageDistributionDto.reward.length;
        rewardLevel++
      ) {
        const rewardToUpdate = getAllrewardLevel.find(
          (reward) =>
            reward.id ===
            rewardPercentageDistributionDto.reward[rewardLevel].rewardLevelId,
        );

        if (rewardToUpdate) {
          rewardToUpdate.reward_perc =
            rewardPercentageDistributionDto.reward[
              rewardLevel
            ].rewardPercentage;
        }
        const totalRewardPerc = getAllrewardLevel.reduce(
          (sum, reward) => sum + parseInt(reward.reward_perc),
          0,
        );
        if (
          totalRewardPerc >
          parseInt(process.env.REWARD_DISTRIBUTION_PERCENTAGE, 10)
        ) {
          throw new HttpException(
            {
              statusCode: HttpStatus.BAD_REQUEST,
              message: [
                'Total reward percentage exceeds 25. No updates performed.',
              ],
            },
            HttpStatus.BAD_REQUEST,
          );
        }
      }
      for (let i = 0; i < rewardPercentageDistributionDto.reward.length; i++) {
        const percentageValue = await getConstantValue(
          this.dbConnection,
          'reward_perc',
        );

        const updateQuery = `CALL put_reward_level_by_id('{"${percentageValue}": "${rewardPercentageDistributionDto.reward[i].rewardPercentage}"}'::jsonb, '${rewardPercentageDistributionDto.reward[i].rewardLevelId}' )`;
        await this.dbConnection.query(updateQuery);
      }
      return {
        message: ['Percentage updated successfully'],
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      logger.error('updateRewardPercentage::error', error);
      throw error;
    }
  }

  async getRewardHistory(
    userId: string,
    page: number,
    perPage: number,
    search: string,
    filter: string,
    startDate: Date,
    endDate: Date,
  ): Promise<any> {
    try {
      logger.info('getRewardHistory');
      const dataValue = await getConstantValue(this.dbConnection, 'user_id');
      const admin = `SELECT * FROM public.get_user('${dataValue}', '${userId}')`;
      const user = await this.dbConnection.query(admin);
      if (user.length < 1) {
        throw new HttpException(
          {
            statusCode: HttpStatus.NOT_FOUND,
            message: ['No user found'],
          },
          HttpStatus.NOT_FOUND,
        );
      }

      const adminUserId = user[0].user_id;
      const adminValue = await getConstantValue(this.dbConnection, 'admin');
      const adminQuery = `SELECT * FROM public.get_user('${adminValue}', '${adminUserId}')`;
      const adminDetails = await this.dbConnection.query(adminQuery);
      if (adminDetails.length < 1) {
        throw new HttpException(
          {
            statusCode: HttpStatus.NOT_FOUND,
            message: ['Incorrect User Id'],
          },
          HttpStatus.NOT_FOUND,
        );
      }

      const query =
        'select trx_hash,created_at,reward_amount, user_id, from_user_id from get_all_user_nft_reward()';
      const data = await this.dbConnection.query(query);

      const usersDetails = [];
      const dataConstantValue = await getConstantValue(
        this.dbConnection,
        'user_id',
      );
      for (let i = 0; i < data.length; i++) {
        const userQuery = `select user_id, first_name,user_wallet from public.get_user('${dataConstantValue}', '${data[i].user_id}')`;
        const userResult = await this.dbConnection.query(userQuery);
        usersDetails.push(userResult);
      }
      const usersArray = [].concat(...usersDetails);
      const buyersDetails = [];

      for (let i = 0; i < data.length; i++) {
        const buyQuery = `select user_id, first_name,level,user_wallet,referred_by_user_id from public.get_user('${dataConstantValue}', '${data[i].from_user_id}')`;
        const result = await this.dbConnection.query(buyQuery);
        buyersDetails.push(result);
      }

      const dataArray = [].concat(...buyersDetails);
      const buyersParentDetails = [];

      for (let i = 0; i < dataArray.length; i++) {
        const buyerParentQuery = `select user_id, first_name,user_wallet from public.get_user('${dataConstantValue}', '${dataArray[i].referred_by_user_id}')`;
        const buyersParentResult = await this.dbConnection.query(
          buyerParentQuery,
        );
        buyersParentDetails.push(buyersParentResult);
      }

      const buyParentArray = [].concat(...buyersParentDetails);

      const finalData = [];

      data.forEach((dataItem) => {
        const matchingUser = usersArray.find(
          (userDataValue) => userDataValue.user_id === dataItem.user_id,
        );
        const matchingData = dataArray.find(
          (dataValueOfUser) =>
            dataValueOfUser.user_id === dataItem.from_user_id,
        );
        const matchingBuyParent = buyParentArray.find(
          (buyParent) => buyParent.user_id === matchingData.referred_by_user_id,
        );

        if (matchingUser && matchingData && matchingBuyParent) {
          finalData.push({
            trx_hash: dataItem.trx_hash,
            created_at: dataItem.created_at,
            reward_amount: dataItem.reward_amount,
            user_id: dataItem.user_id,
            from_user_id: dataItem.from_user_id,
            received_by_name: matchingUser.first_name,
            receiver_wallet_address: matchingUser.user_wallet,
            purchased_by_name: matchingData.first_name,
            purchased_by_tier: matchingData.level,
            purchased_by_wallet_address: matchingData.user_wallet,
            buyers_parent_name: matchingBuyParent.first_name,
            buyers_parent_wallet_address: matchingBuyParent.user_wallet,
          });
        }
      });

      finalData.sort(
        (a, b) =>
          (new Date(b.created_at) as any) - (new Date(a.created_at) as any),
      );
      let filteredData = finalData;

      if (filter === 'lastMonth') {
        const lastMonthDate = new Date();
        lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
        filteredData = filteredData.filter((item) => {
          const createdAtDate = new Date(item.created_at);
          return (
            createdAtDate.getMonth() === lastMonthDate.getMonth() &&
            createdAtDate.getFullYear() === lastMonthDate.getFullYear()
          );
        });
      } else if (filter === 'lastYear') {
        const lastYearDate = new Date();
        lastYearDate.setFullYear(lastYearDate.getFullYear() - 1);
        filteredData = filteredData.filter((item) => {
          const createdAtDate = new Date(item.created_at);
          return createdAtDate.getFullYear() === lastYearDate.getFullYear();
        });
      } else if (filter === 'lastQuarter') {
        const lastQuarterDate = new Date();
        lastQuarterDate.setMonth(lastQuarterDate.getMonth() - 3);
        filteredData = filteredData.filter((item) => {
          const createdAtDate = new Date(item.created_at);
          return createdAtDate >= lastQuarterDate;
        });
      } else if (filter === 'custom') {
        if (startDate && endDate) {
          const startDateObj = new Date(startDate);
          const endDateObj = new Date(endDate);
          filteredData = filteredData.filter((item) => {
            const createdAtDate = new Date(item.created_at);
            createdAtDate.setHours(0, 0, 0, 0);
            startDateObj.setHours(0, 0, 0, 0);
            endDateObj.setHours(0, 0, 0, 0);
            return createdAtDate >= startDateObj && createdAtDate <= endDateObj;
          });
        }
      }

      //searching
      if (search) {
        const searchTerm = search.toLowerCase();

        filteredData = filteredData.filter((item) => {
          const receivedByName = item.received_by_name
            ? item.received_by_name.toLowerCase()
            : '';
          const receiverWalletAddress = item.receiver_wallet_address
            ? item.receiver_wallet_address.toLowerCase()
            : '';
          const trxHash = item.trx_hash ? item.trx_hash.toLowerCase() : '';
          // Check if the search term matches any of the fields
          return (
            receivedByName.includes(searchTerm) ||
            receiverWalletAddress.includes(searchTerm) ||
            trxHash.includes(searchTerm)
          );
        });
      }

      // Pagination
      const pageNo = page; // Page number
      const limit = perPage; // Number of items per page
      const startIndex = (pageNo - 1) * limit;
      const endIndex = pageNo * limit;
      const paginatedData = filteredData.slice(startIndex, endIndex);

      return {
        finalData: paginatedData,
        finalCount: finalData.length,
        filteredDataCount: filteredData.length,
      };
    } catch (e) {
      logger.error('getRewardHistory:::error', e);
      throw e;
    }
  }
}
