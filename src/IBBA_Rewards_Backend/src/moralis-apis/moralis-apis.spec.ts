import { MoralisApisService } from './service/moralis-apis.service'; // Replace with the correct path to your service
import { HttpException, HttpStatus } from '@nestjs/common';
import { NftIdService } from './service/nftId.service';
import { Connection, ConnectionOptions } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { MoralisApisModule } from './moralis-apis.module';

describe('MoralisApisService', () => {
  let moralisService;

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
      imports: [MoralisApisModule], // Import your MoralisApiModule
      providers: [
        MoralisApisService,
        NftIdService,
        Connection,
        // Add other providers/mock dependencies as needed
      ],
    }).compile();

    moralisService = module.get<MoralisApisService>(MoralisApisService);
  });

  describe('getAllNFTsIDHoldingByUser', () => {
    it('should return NFT data for a valid wallet address', async () => {
      const walletAddress = '0x16A819f979513D365262D3d3219Ec34ABf1566eF'; // Replace with a valid Ethereum address
      const nftData = await moralisService.getAllNFTsIDHoldingByUser(walletAddress);
      expect(nftData).toBeDefined();
      // Add more specific assertions here based on the expected output
    });

    it('should handle an invalid wallet address', async () => {
      const walletAddress = '0x16A819f979513D365262D3d3219Ec34ABf1566'; // Replace with an invalid Ethereum address
      try {
        await moralisService.getAllNFTsIDHoldingByUser(walletAddress);
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      }
    });
  });

  describe('walletBalance', () => {
    it('should return the wallet balance for a valid wallet address', async () => {
      const walletAddress = '0x16A819f979513D365262D3d3219Ec34ABf1566eF'; // Replace with a valid Ethereum address
      const balance = await moralisService.walletBalance(walletAddress);
      expect(balance).toBeDefined();
      // Add more specific assertions here based on the expected output
    });

    it('should handle errors when retrieving wallet balance', async () => {
      const walletAddress = '0x16A819f979513D365262D3d3219Ec34ABf1566'; // Replace with an invalid Ethereum address
      try {
        await moralisService.walletBalance(walletAddress);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        // Add more specific assertions here based on the expected error handling
      }
    });
  });

  describe('usdtWalletBalanceBonus', () => {
    it('should return the USDT wallet balance for a valid wallet address', async () => {
      const walletAddress = '0x16A819f979513D365262D3d3219Ec34ABf1566eF'; // Replace with a valid Ethereum address
      const usdtBalance = await moralisService.usdtWalletBalanceBonus(walletAddress);
      expect(usdtBalance).toBeDefined();
      // Add more specific assertions here based on the expected output
    });

    it('should handle errors when retrieving USDT wallet balance', async () => {
      const walletAddress = '0x16A819f979513D365262D3d3219Ec34ABf1566'; // Replace with an invalid Ethereum address
      try {
        await moralisService.usdtWalletBalanceBonus(walletAddress);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        // Add more specific assertions here based on the expected error handling
      }
    });
  });

  // Add more test cases for other methods if needed
});
