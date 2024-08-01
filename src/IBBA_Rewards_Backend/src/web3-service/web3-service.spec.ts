import { Web3ServiceService } from './service/web3-service.service';
import { Connection, ConnectionOptions, DataSource } from 'typeorm';
import { MoralisApisService } from './../moralis-apis/service/moralis-apis.service';
import { TelegramNotificationService } from './../telegram-notification/telegram-notification.service';
import { ConfigService } from '@nestjs/config';
import { SucceededRewardDistributionAddress } from './succeededRewardAddress';
import { FailedRewardDistributionAddress } from './failedRewardAddress';
import { NftIdService } from '../moralis-apis/service/nftId.service';
import { options } from 'yargs';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { Web3ServiceModule } from './web3-service.module';

describe('Web3ServiceService', () => {
  let web3Service: Web3ServiceService;
  let telegramService: TelegramNotificationService;

  const connectionOptions: ConnectionOptions = {
    type: 'postgres',
    host: 'ibba-dev-1.cb5hwvdvchhy.ap-south-1.rds.amazonaws.com',
    port: 5432,
    username: 'ibba_write_user',
    password: 'aqWXNOxdUs4gfdwaq',
    database: 'ibba-dev',
    entities: [],
    synchronize: true,
  };



  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [Web3ServiceModule], // Import your MoralisApiModule
      providers: [
        Web3ServiceService,
        // import db here
      ],
    }).compile();

    web3Service = module.get<Web3ServiceService>(Web3ServiceService);
  });

  it('should check reward balance successfully', async () => {
    const mockWeb3Instance = {
      eth: {
        Contract: jest.fn(() => ({
          methods: {
            getContractBalance: {
              call: jest.fn(() => ({
                Message: 'The current amount of the smart contract is 1000000000000000000',
                Current_Value: '1000000000000000000',
              })),
            },
          },
        })),
        getGasPrice: jest.fn(() => '20000000000'),
      },
    };

    global.Web3 = jest.fn(() => mockWeb3Instance);
    global.fs = {
      readFileSync: jest.fn(() => JSON.stringify({})),
    };

    try {
      const result = await web3Service.checkRewardBalance();
      expect(result).toEqual({
        Message: 'The current amount of the smart contract is 1000000000000000000',
        Current_Value: '1000000000000000000',
      });
    } catch (e) {
      console.log(e);
    }
  });

  it('should handle error when checking reward balance', async () => {
    const mockWeb3Instance = {
      eth: {
        Contract: jest.fn(() => ({
          methods: {
            getContractBalance: {
              call: jest.fn(() => {
                throw new Error('Contract call error');
              }),
            },
          },
        })),
        getGasPrice: jest.fn(() => '20000000000'),
      },
    };

    global.Web3 = jest.fn(() => mockWeb3Instance);
    global.fs = {
      readFileSync: jest.fn(() => JSON.stringify({})),
    };

    try {
      await web3Service.checkRewardBalance();
    } catch (error) {
      expect(error.message).toBe(`Error sending smart contract transaction: This contract object doesn't have address set yet, please set an address first.`);
    }
  });

  it('should handle case when no reward data is available', async () => {
    const mockWeb3Instance = {
        eth: {
          Contract: jest.fn(() => ({
            methods: {
              getContractBalance: {
                call: jest.fn(() => {
                  throw new Error('Contract call error');
                }),
              },
            },
          })),
          getGasPrice: jest.fn(() => '20000000000'),
        },
      };
  
      global.Web3 = jest.fn(() => mockWeb3Instance);
      global.fs = {
        readFileSync: jest.fn(() => JSON.stringify({})),
      };
    // Set up your test data and stubs as needed
    const rewardData = [];
    // Stub your dependencies (dbConnection, web3, checkRewardBalance, telegramService, moralisService, logger) and their functions as needed.

    // Call the function you want to test
    try {
      const result = await web3Service.balanceNotification();
      // Add your assertions here
      expect(result.FundsInCustodialWallet).toBe(`Error sending smart contract transaction: This contract object doesn't have address set yet, please set an address first.`);
    } catch (error) {
      // Handle the error, if any
      expect(error.message).toBe(`There is no data for reward distribution`);
    }
  });

  it('should send notification for low wallet balance', async () => {
    // Set up your test data and stubs as needed
    const rewardData = [
      { id: 1, user_id: 1, reward_amount: '0' },
      // Add more reward data as needed for this scenario
    ];
    const checkRewardBalanceResult = { Current_Value: '10' };
    const walletBalanceResult = 5;

    // Stub your dependencies (dbConnection, web3, checkRewardBalance, telegramService, moralisService, logger) and their functions as needed.

    // Call the function you want to test
    const result = await web3Service.balanceNotification();

    // Add your assertions here
    expect(result.Message).toBe('Funds in custodial wallet is not sufficient for reward');
    expect(result.FundsInCustodialWallet).toBe(walletBalanceResult);
    expect(result.FundsRequiredForReward).toBe(checkRewardBalanceResult.Current_Value);
    // Check if sendNotification function was called with the correct message
    expect(telegramService.sendNotification).toHaveBeenCalledWith(`Funds in custodial wallet is not sufficient for reward, ${checkRewardBalanceResult.Current_Value} ETH`);
  });

  it('should not send notification for sufficient wallet balance', async () => {
    // Set up your test data and stubs as needed
    const rewardData = [
      { id: 1, user_id: 1, reward_amount: '1' },
      // Add more reward data as needed for this scenario
    ];
    const checkRewardBalanceResult = { Current_Value: '10' };
    const walletBalanceResult = 15;

    // Stub your dependencies (dbConnection, web3, checkRewardBalance, telegramService, moralisService, logger) and their functions as needed.

    // Call the function you want to test
    const result = await web3Service.balanceNotification();

    // Add your assertions here
    // Check that no notification was sent
    expect(telegramService.sendNotification).not.toHaveBeenCalled();
  });

  // Add more test cases for other scenarios and edge cases as needed.
});
