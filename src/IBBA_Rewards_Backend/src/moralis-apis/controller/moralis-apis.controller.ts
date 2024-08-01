import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { MoralisApisService } from '../../moralis-apis/service/moralis-apis.service';
import logger from '../../helper/logger';

@Controller('moralisapis')
export class MoralisApisController {
  // ethereumAddressRegex: any;
  private readonly ethereumAddressRegex = /^0x[a-fA-F0-9]{40}$/;
  constructor(private moralisService: MoralisApisService) {}

  @Get('get-nft-tokenIds-holding-by-user/:walletAddress')
  async getNFTs(@Param('walletAddress') walletAddress: string): Promise<any> {

    logger.info(`get-nft-tokenIds-holding-by-user/:walletAddress - ${walletAddress}`);
    let isWalletValid = this.isEthereumAddressValid(walletAddress);
    if (isWalletValid != true) {
    logger.info(`get-nft-tokenIds-holding-by-user/:walletAddress: ${walletAddress} - Wallet address is not correct!`)  
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'Invalid Wallet Address!',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    if (walletAddress === ':walletAddress') {
    logger.info('get-nft-tokenIds-holding-by-user/:walletAddress - Wallet address is empty!')  
    
      throw new HttpException(
        {
          message: ['Wallet address cannot be empty!'],
          statusCode: HttpStatus.BAD_REQUEST,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    const result = await this.moralisService.getAllNFTsIDHoldingByUser(walletAddress);
    console.log(result);
    if(result.length == 0){
      throw new HttpException(
        {
          message: ['This user does not have any NFTs!'],
          statusCode: HttpStatus.NOT_FOUND,
        },
        HttpStatus.NOT_FOUND,
      );
    }
    return this.moralisService.getAllNFTsIDHoldingByUser(walletAddress);
  }

  // Function to check if an Ethereum address is valid
  isEthereumAddressValid(address: string): boolean {
    return this.ethereumAddressRegex.test(address);
  }


  @Get('walletBalance/:walletAddress')
  async walletBalance(
    @Param('walletAddress') walletAddress: string,
  ): Promise<any> {
    if (walletAddress === ':walletAddress') {
      throw new HttpException(
        {
          message: ['Wallet address cannot be empty!'],
          statusCode: HttpStatus.BAD_REQUEST,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    try {
      const result = await this.moralisService.walletBalance(walletAddress);
      return { walletBalance: result };
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('usdtWalletBalance/:userID')
  async usdtWalletBalance(@Param('userID') userID: string): Promise<any> {
    if (userID === ':userID') {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: ['Wallet address cannot be empty!'],
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    try {
      const result = await this.moralisService.usdtWalletBalance(userID);
      return { Information: result };
    } catch (error) {
      if (
        error.message ==
        `Cannot read properties of undefined (reading 'user_wallet')`
      ) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'User ID is wrong!',
          },
          HttpStatus.BAD_REQUEST,
        );
      }
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
