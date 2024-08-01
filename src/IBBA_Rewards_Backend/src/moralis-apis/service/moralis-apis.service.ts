import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common'; // Import required modules and dependencies
import { Network, OpenSeaStreamClient } from '@opensea/stream-js';
import axios from 'axios'; // Import Axios for making HTTP requests
import { Connection } from 'typeorm'; // Import the TypeORM Connection
import { NftIdService } from './nftId.service'; // Import the NftIdService
import { Cron, CronExpression } from '@nestjs/schedule'; // Import NestJS Schedule decorators
import { delay } from 'rxjs';
import logger from '../../helper/logger';
import { boolean } from 'yargs';
import { getConstantValue } from '../../helper/dbHelper';
const WebSocket = require('ws'); // Import the 'ws' package
const Web3 = require('web3'); // Import the Web3 library
const Moralis = require('moralis').default; // Import the Moralis SDK

Moralis.start({
  apiKey: process.env.MORALIS_API_KEY, // Initialize Moralis with the API key
});

@Injectable()
export class MoralisApisService {
  EvmApi: any;
  constructor(
    private readonly nftIdService: NftIdService, // Inject NftIdService
    private readonly dbConnection: Connection, // Inject TypeORM Connection
  ) {}

  /**
   * Retrieves the NFTs (Non-Fungible Tokens) held by a user's wallet address along with additional metadata.
   *
   * @param walletAddress - The wallet address for which to retrieve NFT data.
   * @returns An array of NFT data objects, each containing token ID, title, and image information.
   * @throws Throws an error if there is an issue with the data retrieval, or if the provided wallet address is invalid.
   */
  async getAllNFTsIDHoldingByUser(walletAddress: string) {
    try {
      logger.info('Entering into getAllNFTsIDHoldingByUser function--- ');
      logger.info(`Wallet Address ,${walletAddress}`);
      logger.info(`Moralis Chain --, ${process.env.CHAIN_MORALIS}`);
      logger.info(`Moralis Format -- , ${process.env.FORMAT_MORALIS}`);
      logger.info(
        `Old SMC address --, ${process.env.IBBA_SMART_CONTRACT_PREVIOUS}`,
      );
      logger.info(`New SMC address --, ${process.env.IBBA_SMART_CONTRACT_NEW}`);

      // Step 1: Fetch NFTs associated with the user's wallet address
      const response = await Moralis.EvmApi.nft.getWalletNFTs({
        chain: process.env.CHAIN_MORALIS,
        format: process.env.FORMAT_MORALIS,
        tokenAddresses: [
          process.env.IBBA_SMART_CONTRACT_PREVIOUS,
          process.env.IBBA_SMART_CONTRACT_NEW,
        ],
        mediaItems: false,
        address: walletAddress,
      });

      logger.info(`Details of user's NFTs`, response);

      // Step 2: Extract token IDs and token URIs from the response
      const tokenIds = response.raw.result.map((token) => token.token_id);
      const token_uri = response.raw.result.map((token) => token.token_uri);
      const smartContract = response.raw.result.map(
        (token) => token.token_address,
      );
      logger.info(`smartContractAddress: ${smartContract}`);
      // Step 3: Send HTTP requests to retrieve metadata for each token
      const promises = token_uri.map((url) => axios.get(url));
      const responses = await Promise.all(promises);
      // Step 4: Map and format the NFT data
      const nftData = responses.map((response, index) => {
        return {
          token_id: tokenIds[index],
          title: response.data.name,
          image: response.data.image,
          smartContractAddress: smartContract[index],
        };
      });
      logger.info('NFTs Data sharing on User Interface!');
      logger.info('Process Completed!');
      logger.info(`NFT data --, ${nftData}`);
      return nftData;
    } catch (error) {
      logger.info(`Error, ${error}`);
      logger.info(`error message , ${error}`);
      if (
        error.message === `[C0005] Invalid address provided: ${walletAddress}`
      ) {
        logger.error(`wallet address is not correct!, ${error.message}`);
        // Handle the case of an invalid wallet address
        throw new HttpException(
          {
            message: ['Invalid wallet address provided!'],
            statusCode: HttpStatus.BAD_REQUEST,
          },
          HttpStatus.BAD_REQUEST,
        );
      } else {
        // Handle other errors
        logger.info('Another type of error', error.message);

        throw error;
      }
    }
  }

  /**
   * Retrieves the native balance of a wallet address in Ether (ETH).
   *
   * @param walletAddress - The wallet address for which to retrieve the balance.
   * @returns The balance in Ether.
   * @throws Throws an error if there is an issue with the data retrieval.
   */
  async walletBalance(walletAddress: string) {
    logger.info(`walletBalance native crypto moralis function initiated---`);
    try {
      const response = await Moralis.EvmApi.balance.getNativeBalance({
        chain: process.env.CHAIN_MORALIS,
        address: walletAddress,
      });
      const balance = Web3.utils.fromWei(response.raw.balance, 'ether');
      logger.info(`balance: ${balance}`);
      const balanceNumber = parseFloat(balance);
      logger.info(`${balanceNumber.toFixed(4)}`);
      const usdtbalance = await this.usdtWalletBalanceBonus(walletAddress);

      return{
        ETH: balanceNumber.toFixed(4),
        USDT: usdtbalance.WalletBalance,
      } 
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async usdtWalletBalanceBonus(walletAddress: string) {
    logger.info(
      `usdtWalletBalanceBonus USDT/ERC20 moralis function initiated---`,
    );
    try {
      const response = await Moralis.EvmApi.token.getWalletTokenBalances({
        chain: process.env.CHAIN_MORALIS,
        address: walletAddress,
      });

      const filteredData = response.jsonResponse.filter(
        (item) =>
          item.token_address === process.env.USDT_TOKEN_ADDRESS.toLowerCase(),
      );

      if (filteredData.length == 0) {
        return {
          WalletBalance: 0,
          WalletAddress: walletAddress,
        };
      }
      const balance = Web3.utils.fromWei(filteredData[0].balance, 'ether');
      return {
        WalletBalance: balance,
        WalletAddress: walletAddress,
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async usdtWalletBalance(userId: string) {
    logger.info(`usdtWalletBalance USDT/ERC20 moralis function initiated---`);
    try {
      const userIdConstant = await getConstantValue(
        this.dbConnection,
        'user_id',
      );

      const userWallets = [userIdConstant, userId];
      const queryToGetUserWallets = 'SELECT user_wallet FROM get_user($1,$2)';
      const walletAddress = await this.dbConnection.query(
        queryToGetUserWallets,
        userWallets,
      );
      logger.info(`Wallet address: ${walletAddress[0].user_wallet}`);
      const response = await Moralis.EvmApi.token.getWalletTokenBalances({
        chain: process.env.CHAIN_MORALIS,
        address: walletAddress[0].user_wallet,
      });

      const filteredData = response.jsonResponse.filter(
        (item) =>
          item.token_address === process.env.USDT_TOKEN_ADDRESS.toLowerCase(),
      );

      if (filteredData.length == 0) {
        return {
          WalletBalance: 0,
          WalletAddress: walletAddress[0].user_wallet,
        };
      }
      const balance = Web3.utils.fromWei(filteredData[0].balance, 'ether');
      return {
        WalletBalance: balance,
        WalletAddress: walletAddress[0].user_wallet,
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Validates whether the given string is a valid Ethereum address.
   *
   * @param address - The Ethereum address to validate.
   * @returns `true` if the address is valid, `false` otherwise.
   */
  isValidEthereumAddress(address) {
    const regex = /^(0x)?[0-9a-fA-F]{40}$/;
    return regex.test(address);
  }
}
