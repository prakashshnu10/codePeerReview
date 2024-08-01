import { Injectable } from '@nestjs/common';
import { Network, OpenSeaStreamClient } from '@opensea/stream-js';
import { promises } from 'dns';
import logger from '../helper/logger';
import { Connection } from 'typeorm';
const Web3 = require('web3');
const WebSocket = require('ws'); // Import the 'ws' package
import { DirectSaleRewardService } from 'src/reward/directSaleRewardDistribution';
import { RewardCronService } from 'src/reward/cronReward.service';
import { Web3ServiceService } from 'src/web3-service/service/web3-service.service';
import { BadgesDistributionCronService } from 'src/badges/badgesDistributionCron.service';
import { delay } from 'src/helper/delay';
import { EmailNotificationService } from 'src/email-notification/email-notification.service';

@Injectable()
export class OpenSeaWebSocketService {
  constructor(
    private readonly dbConnection: Connection,
    private calculateBonusDistribution: BadgesDistributionCronService,
    private calculateIndirectRewardDistribution: RewardCronService,
    private calculateDirectRewardDistribution: DirectSaleRewardService,
    private balanceNotification: Web3ServiceService,
    private emailNotification: EmailNotificationService,
  ) {}

  async onModuleInit() {
    await this.getTransferEvents();
  }

  async getTransferEvents(): Promise<void> {
    logger.info(`getTransferEvents (OpenSea-SoldEvent) function initiated ---`);
    try {
      const newMintingCollection = process.env.NEW_NFT_COLLECTION;
      const oldMintingCollection = process.env.OLD_NFT_COLLECTION;
      logger.info(`newMintingCollection , ${newMintingCollection}`);
      logger.info(`oldMintingCollection , ${oldMintingCollection}`);
      logger.info(`Network , ${Network[process.env.OPENSEA_NETWORK]}`);
      const client = new OpenSeaStreamClient({
        token: process.env.OPENSEA_API_KEY,
        network: Network[process.env.OPENSEA_NETWORK],
        connectOptions: {
          transport: WebSocket, // Use the WebSocket class from the 'ws' package
        },
      });

      // Connect to the OpenSea Stream API
      client.connect();

      // Subscribe to the 'Item sold' event
      client.onItemSold(newMintingCollection, async (event) => {
        // Handle the 'Item sold' event
        logger.info(`event: ${event}`);
        const soldEvent = event;
        logger.info(
          `NFT has been sold by new SMC, here is the details: ${event}`,
        );

        const sellerAddress = soldEvent.payload.maker.address;
        logger.info(`sellerAddress , ${sellerAddress}`);
        const queryToGetTreasuryWallet = 'select * from get_admin_treasury()';
        const getTreasuryWallet = await this.dbConnection.query(
          queryToGetTreasuryWallet,
        );
        logger.info(`getTreasuryWallet , ${getTreasuryWallet}`);
        const treasuryWallet = getTreasuryWallet[0].current_treasury_wallet;
        logger.info(`TreasuryWallet , ${treasuryWallet}`);

        // Extract the addresses and store them in an array
        const addresses = [];

        getTreasuryWallet.forEach((item) => {
          if (item.previous_treasury_wallet) {
            addresses.push(item.previous_treasury_wallet);
          }
          if (item.current_treasury_wallet) {
            addresses.push(item.current_treasury_wallet);
          }
        });

        logger.info(`List of Treasury Wallet: , ${addresses}`);

        // Use the flat method to flatten the nested array
        const flattenedTreasuryWallets = addresses.flat();

        logger.info(`flattenedTreasuryWallets , ${flattenedTreasuryWallets}`);

        let flag = false;
        logger.info(
          `Length of the Treasury wallets: ${flattenedTreasuryWallets.length}`,
        );

        if (flattenedTreasuryWallets.length > 0) {
          for (let i = 0; i < flattenedTreasuryWallets.length; i++) {
            const treasuryWalletAddress = flattenedTreasuryWallets[i];
            if (
              sellerAddress.toLowerCase() == treasuryWalletAddress.toLowerCase()
            ) {
              flag = true;
            }
          }
        }

        if (flag) {
          const salePrice = soldEvent.payload.sale_price;
          logger.info(`salePrice: ${salePrice}`);
          const salePriceInETH = Web3.utils.fromWei(salePrice, 'ether');
          logger.info(`salePriceInETH: ${salePriceInETH}`);
          const buyerAddress = soldEvent.payload.taker.address;

          logger.info(`buyerAddress: ${buyerAddress}`);

          const nftDetails = soldEvent.payload.item.nft_id;
          const tokenId = await this.getTokenId(nftDetails);
          // const tokenId = 7;
          logger.info(`tokenId: ${tokenId}`);

          const queryToGetNFTId = `SELECT id FROM m_nft WHERE token_id = ${Number(
            tokenId,
          )}`;
          const nftId = await this.dbConnection.query(queryToGetNFTId);
          logger.info(`nftId: ${nftId}`);
          const queryToGetUserId = `SELECT user_id FROM m_users WHERE user_wallet = '${buyerAddress.toLowerCase()}'`;
          logger.info(`queryToGetUserId: ${queryToGetUserId}`);
          const userId = await this.dbConnection.query(queryToGetUserId);
          logger.info(`userId: ${userId}`);

          if (userId.length > 0) {
            const query = 'CALL post_user_nft($1, $2, $3, $4, $5, $6)';
            const values = [
              userId[0].user_id,
              nftId[0].id,
              process.env.MARKET_TYPE,
              process.env.CREATED_BY,
              process.env.UPDATED_BY,
              salePriceInETH,
            ];

            logger.info(`values , ${values}`);

            await this.dbConnection
              .query(query, values)
              .then((data) => {
                logger.info(`data: ${data}`);
                const queryToUpdateUsersNFTPurchased = `UPDATE m_users SET is_nft_purchased = True WHERE user_id = '${userId[0].user_id}'`;
                return this.dbConnection.query(queryToUpdateUsersNFTPurchased);
              })

              .then((updatingUsersNFTPurchased) => {
                logger.info(
                  `updatingUsersNFTPurchased: ${updatingUsersNFTPurchased}`,
                );
                logger.info(
                  'initialize send notification for nft purchased::::1',
                );
                return this.emailNotification.nftPurchased();
              })

              .then(() => {
                logger.info(
                  ' completed send notification for nft purchased::::1',
                );
                logger.info('initialize indirect reward calculation::::1');
                return this.calculateIndirectRewardDistribution.calculateIndirectRewardDistribution();
              })

              .then(() => {
                logger.info('completed indirect reward calculation::::1');
                logger.info('initialize direct reward calculation::::1');
                return this.calculateDirectRewardDistribution.calculateDirectRewardDistribution();
              })
              .then(() => {
                logger.info('completed direct reward calculation::::1');
                logger.info(
                  'initialize directsales reward due email notification::::1',
                );
                return this.emailNotification.directSalesRewardDue();
              })
              .then(() => {
                logger.info('completed directsales reward due::::1');
                logger.info(
                  'initialize indirectsales reward due email notification::::1',
                );
                return this.emailNotification.indirectSalesRewardDue();
              })
              .then(() => {
                logger.info(
                  'completed indirectsales reward due email notification::::1',
                );
                logger.info('initialize bonus calculation::::1');
                return this.calculateBonusDistribution.calculateBonusDistribution();
              })
              .then(() => {
                logger.info('completed bonus calculation::::1');
                logger.info('initialize bonus due email notification::::1');
                return this.emailNotification.BonusDue();
              })

              .then(() => {
                logger.info('completed bonus due email notification::::1');
                logger.info('initialize balanceNotification::::1');
                return this.balanceNotification.balanceNotification();
              })

              .then(() => {
                logger.info('completed balanceNotification::::1');
              })
              .catch((error) => {
                logger.error(`Error:::::::: ${error}`);
              });
          } else {
            logger.info(
              `Buyer address: ${buyerAddress} is not exists in the system!`,
            );
          }
        } else {
          logger.info('NFTs is not in primary market!');
        }
      });

      // Subscribe to the 'Item sold' event
      client.onItemSold(oldMintingCollection, async (event) => {
        // Handle the 'Item sold' event
        logger.info(`event: ${event}`);
        const soldEvent = event;
        logger.info(
          `NFT has been sold by old SMC, here is the details: ${event}`,
        );

        const sellerAddress = soldEvent.payload.maker.address;
        logger.info(`sellerAddress , ${sellerAddress}`);

        const queryToGetTreasuryWallet = 'select * from get_admin_treasury()';
        const getTreasuryWallet = await this.dbConnection.query(
          queryToGetTreasuryWallet,
        );
        logger.info(`getTreasuryWallet , ${getTreasuryWallet}`);
        const treasuryWallet = getTreasuryWallet[0].current_treasury_wallet;
        logger.info(`TreasuryWallet , ${treasuryWallet}`);

        // Extract the addresses and store them in an array
        const addresses = [];

        getTreasuryWallet.forEach((item) => {
          if (item.previous_treasury_wallet) {
            addresses.push(item.previous_treasury_wallet);
          }
          if (item.current_treasury_wallet) {
            addresses.push(item.current_treasury_wallet);
          }
        });

        logger.info(`List of Treasury Wallet: , ${addresses}`);

        // Use the flat method to flatten the nested array
        const flattenedTreasuryWallets = addresses.flat();

        logger.info(`flattenedTreasuryWallets , ${flattenedTreasuryWallets}`);

        let flag = false;
        for (let i = 0; i < flattenedTreasuryWallets.length; i++) {
          const treasuryWalletAddress = flattenedTreasuryWallets[i];
          if (
            sellerAddress.toLowerCase() == treasuryWalletAddress.toLowerCase()
          ) {
            flag = true;
          }
        }

        logger.info('flag', flag);

        if (flag) {
          const salePrice = soldEvent.payload.sale_price;
          logger.info(`salePrice: ${salePrice}`);
          const salePriceInETH = Web3.utils.fromWei(salePrice, 'ether');
          logger.info(`salePriceInETH: ${salePriceInETH}`);
          const buyerAddress = soldEvent.payload.taker.address;
          // const buyerAddress = '0x0eeb75b535614c84879c8443f4a5fd03eab36922';

          logger.info(`buyerAddress: ${buyerAddress}`);
          const nftDetails = soldEvent.payload.item.nft_id;
          const tokenId = await this.getTokenId(nftDetails);
          // const tokenId = 7;
          logger.info(`tokenId: ${tokenId}`);

          const queryToGetNFTId = `SELECT id FROM m_nft WHERE token_id = ${Number(
            tokenId,
          )}`;
          const nftId = await this.dbConnection.query(queryToGetNFTId);
          logger.info(`nftId: ${nftId}`);
          const queryToGetUserId = `SELECT user_id FROM m_users WHERE user_wallet = '${buyerAddress.toLowerCase()}'`;
          logger.info(`queryToGetUserId: ${queryToGetUserId}`);
          const userId = await this.dbConnection.query(queryToGetUserId);
          logger.info(`userId: ${userId}`);
          if (userId.length > 0) {
            const query = 'CALL post_user_nft($1, $2, $3, $4, $5, $6)';
            const values = [
              userId[0].user_id,
              nftId[0].id,
              process.env.MARKET_TYPE,
              process.env.CREATED_BY,
              process.env.UPDATED_BY,
              salePriceInETH,
            ];

            logger.info(`values , ${values}`);

            await this.dbConnection
              .query(query, values)
              .then((data) => {
                logger.info(`data: ${data}`);
                const queryToUpdateUsersNFTPurchased = `UPDATE m_users SET is_nft_purchased = True WHERE user_id = '${userId[0].user_id}'`;
                return this.dbConnection.query(queryToUpdateUsersNFTPurchased);
              })
              .then((updatingUsersNFTPurchased) => {
                logger.info(
                  `updatingUsersNFTPurchased: ${updatingUsersNFTPurchased}`,
                );
                logger.info(
                  'initialize send notification for nft purchased::::2',
                );
                return this.emailNotification.nftPurchased();
              })

              .then(() => {
                logger.info(
                  ' completed send notification for nft purchased::::2',
                );
                logger.info('initialize indirect reward calculation::::2');
                return this.calculateIndirectRewardDistribution.calculateIndirectRewardDistribution();
              })

              .then(() => {
                logger.info('completed indirect reward calculation::::2');
                logger.info('initialize direct reward calculation::::2');
                return this.calculateDirectRewardDistribution.calculateDirectRewardDistribution();
              })
              .then(() => {
                logger.info('completed direct reward calculation::::2');
                logger.info('initialize directsales reward due::::2');
                return this.emailNotification.directSalesRewardDue();
              })
              .then(() => {
                logger.info('completed directsales reward due::::2');
                logger.info('initialize indirectsales reward due::::2');
                return this.emailNotification.indirectSalesRewardDue();
              })
              .then(() => {
                logger.info('completed indirectsales reward due::::2');
                logger.info('initialize bonus calculation::::2');
                return this.calculateBonusDistribution.calculateBonusDistribution();
              })

              .then(() => {
                logger.info('completed bonus calculation::::2');
                logger.info('initialize bonus due email notification::::2');
                return this.emailNotification.BonusDue();
              })
              .then(() => {
                logger.info('completed bonus due email notification::::2');
                logger.info('initialize balanceNotification::::2');
                return this.balanceNotification.balanceNotification();
              })

              .then(() => {
                logger.info('completed balanceNotification::::2');
              })
              .catch((error) => {
                logger.error(`Error:::::::: ${error}`);
              });
          } else {
            logger.info('NFTs is not in primary market!');
          }
        }
      });
    } catch (error) {
      logger.error('Error:', error);
    }
  }

  async getTokenId(nftDetails) {
    const link = nftDetails;
    const numberPattern = /\/(\d+)$/; // Match a slash followed by one or more digits at the end of the string
    const match = link.match(numberPattern);

    if (match) {
      const extractedNumber = parseInt(match[1], 10); // Convert the matched string to an integer
      logger.info(`Extracted Number: ${extractedNumber}`);
      return extractedNumber;
    } else {
      logger.info(`Number not found in the link.`);
    }
  }
}
