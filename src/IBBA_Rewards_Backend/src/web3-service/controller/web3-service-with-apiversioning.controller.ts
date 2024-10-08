import {
    Body,
    Controller,
    Get,
    HttpException,
    HttpStatus,
    Param,
    Post,
    ValidationPipe,
    Version,
  } from '@nestjs/common';
  import { Web3ServiceService } from '../service/web3-service.service';
  import { AddFunds_Dto } from '../dto/add.funds.dto';
  import { ValidationError, validate } from 'class-validator';
  import { plainToClass } from 'class-transformer';
  import { ConfigService } from '@nestjs/config';
  
  @Controller('api/v1/web3-service')
  export class Web3ServiceController {
    constructor(
      private readonly web3Service: Web3ServiceService,
      private configService: ConfigService
    ) {}
    
    private readonly ethereumAddressRegex = /^0x[a-fA-F0-9]{40}$/;
  
    @Get('check-balance')
    async checkBalance() {
      try {
        const result = await this.web3Service.checkRewardBalance();
        return { message: 'Information', data: result };
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
  
    @Get('add-Funds-For-Bonus/:funds')
    async addFundsForBonusAPI(@Param('funds') funds: string): Promise<any> {
      try {
        const result = await this.web3Service.addFundsForBonus(funds);
        return { message: 'Information', data: result };
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
    
    @Get('wallet-balance-notification')
    async walletNotification() {
      try {
        const result = await this.web3Service.balanceNotification();
        return { message: 'Information', data: result };
      } catch (error) {
        if (error.message === 'There is no data for reward distribution') {
          throw new HttpException(
            {
              statusCode: HttpStatus.NOT_FOUND,
              message: ['There is no data for reward distribution'],
            },
            HttpStatus.NOT_FOUND,
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
  
    @Get('check-env-file')
    getEnvVariables() {
      const var1 = this.configService.get<string>('CHAIN_MORALIS');
      const var2 = this.configService.get<string>('OPENSEA_NETWORK');
      const var3 = this.configService.get<string>('CHAIN_OPENSEA');
  
      if (var1 && var2 && var3) {
        return `All required environment variables are defined: VAR1=${var1}, VAR2=${var2}, VAR3=${var3}`;
      } else {
        return 'Some of the required environment variables are not defined.';
      }
    }
  
    @Get('reward-distribution')
    async reward() {
      try {
        const result = await this.web3Service.rewardDistribution();
        return { message: 'Information', data: result };
      } catch (error) {
        if (error.message === 'There is no data for reward distribution') {
          throw new HttpException(
            {
              statusCode: HttpStatus.NOT_FOUND,
              message: ['There is no data for reward distribution'],
            },
            HttpStatus.NOT_FOUND,
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
  
    @Get('bonus-distribution')
    async bonus() {
      try {
        const result = await this.web3Service.bonusDistribution();
        return { message: 'Information', data: result };
      } catch (error) {
        if (error.message === 'There is no data for bonus distribution') {
          throw new HttpException(
            {
              statusCode: HttpStatus.NOT_FOUND,
              message: ['There is no data for bonus distribution'],
            },
            HttpStatus.NOT_FOUND,
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
  
    @Post('add-funds')
    async addFunds(
      @Body(ValidationPipe) addFunds_dto: AddFunds_Dto,
    ): Promise<any> {
      const validationErrors: ValidationError[] = await validate(
        plainToClass(AddFunds_Dto, addFunds_dto),
      );
  
      if (validationErrors.length > 0) {
        const errorMessage = validationErrors.map((error) =>
          Object.values(error.constraints).join(', '),
        );
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            error: 'Validation failed',
            data: errorMessage,
          },
          HttpStatus.BAD_REQUEST,
        );
      }
      try {
        const result = await this.web3Service.addFunds(addFunds_dto);
        return { message: 'Funds added successfully', data: result };
      } catch (error) {
        throw new HttpException(
          {
            status: HttpStatus.INTERNAL_SERVE
  