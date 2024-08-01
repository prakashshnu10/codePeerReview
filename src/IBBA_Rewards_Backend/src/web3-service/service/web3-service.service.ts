import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import * as fs from 'fs';
import path, { join } from 'path';
import { Connection } from 'typeorm';
import { SucceededRewardDistributionAddress } from '../succeededRewardAddress';
import { FailedRewardDistributionAddress } from '../failedRewardAddress';
import { AddFunds_Dto } from '../dto/add.funds.dto';
import axios from 'axios';
import { map, throwError } from 'rxjs';
import { error, log } from 'console';
import { mintNFT_Dto } from '../dto/mintNFT.dto';
import { mintNFTInBatch_Dto } from '../dto/mintNFTInBatch.dto';
import { OpenSeaStreamClient } from '@opensea/stream-js';
import { Cron, CronExpression } from '@nestjs/schedule';
import { getConstantValue } from '../../helper/dbHelper';
import { MoralisApisService } from '../../moralis-apis/service/moralis-apis.service';
import logger from '../../helper/logger';
import { MailerService } from '@nestjs-modules/mailer';
import { EmailService } from 'src/otp/services/email.service';
import { TelegramNotificationService } from '../../telegram-notification/telegram-notification.service';
import { delay } from '../../helper/delay';
import { ConfigService } from '@nestjs/config';
import * as dayjs from 'dayjs';
import { EmailNotificationService } from 'src/email-notification/email-notification.service';
import { th } from 'date-fns/locale';

const WebSocket = require('ws');
const Web3 = require('web3');
const Moralis = require('moralis').default; // Import the Moralis SDK

// private key to sign web3 transaction
const privateKeyReward = process.env.PRIVATE_KEY;
const privateKeyMint = process.env.PRIVATE_KEY;
// Address which will be used to sign the reward smart contract transaction
const fromAddressReward = process.env.FROM_ADDRESS;
const fromAddressMint = process.env.FROM_ADDRESS;
// Reward smart contract address which will be used to do reward distribution
const rewardSmartContract = process.env.REWARD_SMC;
const ibbaSmartContract = process.env.TOKEN_ADDRESS;
const usdtSmartContract = process.env.USDT_TOKEN_ADDRESS;
const gasBuffer = Number(process.env.GAS_BUFFER_FOR_TRANSACTION);

@Injectable()
export class Web3ServiceService {
  constructor(
    private readonly succeededRewardAddress: SucceededRewardDistributionAddress,
    private readonly failededRewardAddress: FailedRewardDistributionAddress,
    private readonly dbConnection: Connection,
    private moralisService: MoralisApisService,
    private telegramService: TelegramNotificationService,
    private configService: ConfigService,
    private emailNotification: EmailNotificationService,
  ) {}

  // Regular expression to validate Ethereum addresses
  private readonly ethereumAddressRegex = /^0x[a-fA-F0-9]{40}$/;

  async checkRewardBalance() {
    logger.info(`checkRewardBalance function initiated---`);
    try {
      // Create a Web3 instance connected to the provided URL
      const web3 = new Web3(process.env.RPC_URL_TO_CONNECT_NODE);

      // Read the ABI from the contract file
      let abi = fs.readFileSync(
        join(process.cwd(), './src/smartContract/reward.abi'),
      );

      // Instantiate the contract using the loaded ABI and contract address
      const contract = new web3.eth.Contract(
        JSON.parse(abi.toString()),
        rewardSmartContract,
      );

      // Call the 'getContractBalance' method of the contract
      const result = await contract.methods.getContractBalance().call();
      // Return the result object containing balance information
      return {
        Message: `The current amount of the smart contract is ${result}`,
        Current_Value: result,
      };
    } catch (error) {
      throw new Error(
        `Error sending smart contract transaction: ${error.message}`,
      );
    }
  }

  async checkBonusBalance() {
    logger.info(`checkBonusBalance function initiated---`);
    // Create a Web3 instance connected to the provided URL
    const web3 = new Web3(process.env.RPC_URL_TO_CONNECT_NODE);

    // Read the ABI from the contract file
    let abi = fs.readFileSync(
      join(process.cwd(), './src/smartContract/reward.abi'),
    );

    // Instantiate the contract using the loaded ABI and contract address
    const contract = new web3.eth.Contract(
      JSON.parse(abi.toString()),
      rewardSmartContract,
    );

    try {
      // Call the 'getContractBalance' method of the contract
      const result = await contract.methods.balanceOfUSDT().call();
      // Return the result object containing balance information
      return {
        Message: `The current USDT amount of the smart contract is ${result}`,
        Current_Value: result,
      };
    } catch (error) {
      throw new Error(
        `Error sending smart contract transaction: ${error.message}`,
      );
    }
  }

  // Function to check if an Ethereum address is valid
  isEthereumAddressValid(address: string): boolean {
    return this.ethereumAddressRegex.test(address);
  }

  async balanceNotification() {
    logger.info(`balanceNotification function initiated-----`);
    try {
      const correctRewardData = [];
      const incorrectRewardData = [];
      let totalRewardAmount = 0;
      const web3 = new Web3(process.env.RPC_URL_TO_CONNECT_NODE);

      // Fetch reward data for distribution
      const queryToGetRewardData =
        'SELECT * FROM public.get_undistributed_rewards()';

      const rewardData = await this.dbConnection.query(queryToGetRewardData);

      logger.info(`rewardData is ${rewardData}`);

      const mappedRewardData = rewardData.map((item) => ({
        id: item.id,
        user_id: item.user_id,
        reward_amount: item.reward_amount,
      }));

      logger.info(`mappedRewardData is ${mappedRewardData}`);

      mappedRewardData.forEach((item) => {
        if (item.reward_amount !== '0') {
          // If reward_amount is not zero, it's a successful distribution
          correctRewardData.push(item);
        } else {
          // If reward_amount is zero, it's a failed distribution
          incorrectRewardData.push(item);
        }
      });

      logger.info(`correctRewardData is ${correctRewardData}`);
      logger.warn(`incorrectRewardData is ${incorrectRewardData}`);

      // Handle case when no reward data is available
      if (rewardData.length === 0) {
        throw new Error('There is no data for reward distribution');
      }

      const txnHashConstant = await getConstantValue(
        this.dbConnection,
        'trx_hash',
      );
      logger.info(`txnHashConstant ,${txnHashConstant}`);

      const rewardAmount = correctRewardData.map((item) => item.reward_amount);
      let totalRewardAmountInWei = Web3.utils.toWei(
        totalRewardAmount.toString(),
        'ether',
      );
      logger.info(`totalRewardAmountInWei is ${totalRewardAmountInWei}`);
      logger.info(`rewardAmount is ${rewardAmount}`);
      for (const i of rewardAmount) {
        const rewardAmountInWei = Web3.utils.toWei(i.toString(), 'ether');
        totalRewardAmountInWei =
          Number(totalRewardAmountInWei) + Number(rewardAmountInWei);
      }

      logger.info(`totalRewardAmountInWei is ${totalRewardAmountInWei}`);
      const rewardAmountInETH = Web3.utils.fromWei(
        totalRewardAmountInWei.toString(),
        'ether',
      );

      // Check if smart contract balance is sufficient for distribution
      const checkRewardSmartContractBalance = await this.checkRewardBalance();
      const balanceInRewardSMCInETH = Web3.utils.fromWei(
        checkRewardSmartContractBalance.Current_Value,
        'ether',
      );
      logger.info(`balanceInRewardSMCInETH is ${balanceInRewardSMCInETH}`);
      logger.info(`rewardAmountInETH is ${rewardAmountInETH}`);

      if (rewardAmountInETH >= balanceInRewardSMCInETH) {
        let walletFund = await this.moralisService.walletBalance(
          process.env.FROM_ADDRESS,
        );
        logger.info(`walletFund is ${walletFund}`);
        const totalRewardAmount =
          Number(balanceInRewardSMCInETH) + Number(walletFund);
        logger.info(`totalRewardAmount is ${totalRewardAmount}`);

        if (totalRewardAmount < rewardAmountInETH) {
          //Send notification to admin for low wallet balance
          const sendNotificationForLowBalance =
            this.telegramService.sendNotification(
              `Funds in custodial wallet is not sufficient for reward, ${rewardAmountInETH} ETH`,
            );
          logger.info(
            `Send notification to admin for low wallet balance: ${sendNotificationForLowBalance}`,
          );

          return {
            Message: 'Funds in custodial wallet is not sufficient for reward',
            FundsInCustodialWallet: walletFund,
            FundsRequiredForReward: rewardAmountInETH,
          };
        }
      }
    } catch (error) {
      throw error;
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_3PM)
  async rewardDistribution() {
    logger.info('Reward API Initiated----');
    logger.info(`Reward Smart Contract Address is ${rewardSmartContract}`);

    let succeededRecipients: string;
    let failedRecipients: string;
    let userWalletExtracted: string[] = [];
    const correctRewardData = [];
    const incorrectRewardData = [];
    let totalRewardAmount = 0;
    let incorrectWalletAddress;

    const web3 = new Web3(process.env.RPC_URL_TO_CONNECT_NODE);
    try {
      // Load ABI and instantiate the contract
      const abi = fs.readFileSync(
        join(process.cwd(), './src/smartContract/reward.abi'),
      );
      const contract = new web3.eth.Contract(
        JSON.parse(abi.toString()),
        rewardSmartContract,
      );

      // Fetch reward data for distribution
      const queryToGetRewardData =
        'SELECT * FROM public.get_undistributed_rewards()';
      const rewardData = await this.dbConnection.query(queryToGetRewardData);
      logger.info(`rewardData is ${rewardData}`);

      // Handle case when no reward data is available
      if (rewardData.length === 0) {
        throw new Error('There is no data for reward distribution');
      }
      const mappedRewardData = rewardData.map((item) => ({
        id: item.id,
        user_id: item.user_id,
        reward_amount: item.reward_amount,
      }));

      logger.info(`mappedRewardData is ${mappedRewardData}`);

      mappedRewardData.forEach((item) => {
        if (item.reward_amount !== 0) {
          // If reward_amount is not zero, it's a successful distribution
          correctRewardData.push(item);
        } else {
          // If reward_amount is zero, it's a failed distribution
          incorrectRewardData.push(item);
        }
      });

      logger.info(`correctRewardData is ${correctRewardData}`);
      logger.warn(`incorrectRewardData is ${incorrectRewardData}`);

      let rewardDataUserBoughtNFT = [];
      let rewardDataUserNotBoughtNFT = [];

      for (let i = 0; i < correctRewardData.length; i++) {
        const queryToCheckUserHasBoughtNFTOrNot = `SELECT is_nft_purchased FROM m_users WHERE user_id = '${correctRewardData[i].user_id}'`;
        const toCheckUserHasBoughtNFTOrNot = await this.dbConnection.query(
          queryToCheckUserHasBoughtNFTOrNot,
        );
        logger.info(
          `toCheckUserHasBoughtNFTOrNot:
          ${toCheckUserHasBoughtNFTOrNot[0].is_nft_purchased}`,
        );
        if (toCheckUserHasBoughtNFTOrNot[0].is_nft_purchased == false) {
          rewardDataUserNotBoughtNFT.push(correctRewardData[i]);
        } else {
          rewardDataUserBoughtNFT.push(correctRewardData[i]);
        }
      }

      // Handle case when no reward data is available
      if (rewardDataUserBoughtNFT.length === 0) {
        throw new Error(
          'Reward distribution cannot be done because user has not bought any NFT',
        );
      }

      const rewardNotificationConstant = await getConstantValue(
        this.dbConnection,
        'notification',
      );

      const rewardDistributedConstant = await getConstantValue(
        this.dbConnection,
        'reward_distributed',
      );

      const messageConstant = await getConstantValue(
        this.dbConnection,
        'message',
      );

      const txnHashConstant = await getConstantValue(
        this.dbConnection,
        'trx_hash',
      );
      logger.info(`txnHashConstant ,${txnHashConstant}`);

      const gasUsedConstant = await getConstantValue(
        this.dbConnection,
        'gas_fee',
      );

      logger.info(`rewardDataUserBoughtNFT: ${rewardDataUserBoughtNFT}`);

      // Extract relevant data for distribution
      const rewardId = rewardDataUserBoughtNFT.map((item) => item.id);
      const userIDs = rewardDataUserBoughtNFT.map((item) => item.user_id);
      const rewardAmount = rewardDataUserBoughtNFT.map(
        (item) => item.reward_amount,
      );
      let totalRewardAmountInWei = Web3.utils.toWei(
        totalRewardAmount.toString(),
        'ether',
      );
      logger.info(`totalRewardAmountInWei is ${totalRewardAmountInWei}`);
      logger.info(`rewardAmount is ${rewardAmount}`);
      for (const i of rewardAmount) {
        const rewardAmountInWei = Web3.utils.toWei(i.toString(), 'ether');
        totalRewardAmountInWei =
          Number(totalRewardAmountInWei) + Number(rewardAmountInWei);
      }

      logger.info(`totalRewardAmountInWei is ${totalRewardAmountInWei}`);
      const rewardAmountInETH = Web3.utils.fromWei(
        totalRewardAmountInWei.toString(),
        'ether',
      );

      // Check if smart contract balance is sufficient for distribution
      const checkRewardSmartContractBalance = await this.checkRewardBalance();
      const balanceInRewardSMCInETH = Web3.utils.fromWei(
        checkRewardSmartContractBalance.Current_Value,
        'ether',
      );
      logger.info(`balanceInRewardSMCInETH is ${balanceInRewardSMCInETH}`);
      logger.info(`rewardAmountInETH is ${rewardAmountInETH}`);

      if (rewardAmountInETH >= balanceInRewardSMCInETH) {
        let walletFund = await this.moralisService.walletBalance(
          process.env.FROM_ADDRESS,
        );

        const walletFundInETH = walletFund.ETH;
        logger.info(`walletFund is ${walletFundInETH}`);
        const totalRewardAmount =
          Number(balanceInRewardSMCInETH) + Number(walletFundInETH);
        logger.info(`totalRewardAmount is ${totalRewardAmount}`);

        if (totalRewardAmount > rewardAmountInETH) {
          const percentage = Number(process.env.GAS_FEE_REQUIRED_PERCENTAGE); // 10%
          let value = (percentage / 100) * Number(walletFundInETH);
          let valueToBeAdd = Number(walletFundInETH) - Number(value);
          logger.info(`Adding funds in reward smart contract: ${valueToBeAdd}`);
          const result = await this.addFunds(valueToBeAdd);
          logger.info(`Details: ${result}`);
        } else if (totalRewardAmount < rewardAmountInETH) {
          return {
            Message: 'Funds in custodial wallet is not sufficient for reward',
            FundsInCustodialWallet: walletFundInETH,
            FundsRequiredForReward: rewardAmountInETH,
          };
        }
      }

      // Map reward IDs to user IDs for batch processing
      const mappedRewardIdWithUserId = rewardId.map((rewardId, index) => ({
        rewardId,
        userId: userIDs[index],
      }));

      logger.info(`mappedRewardIdWithUserId: ${mappedRewardIdWithUserId}`);
      const userIDDB = await getConstantValue(this.dbConnection, 'user_id');
      logger.info(
        `Constant value to fetch user wallet from database is ${userIDDB}`,
      );
      for (let i = 0; i < rewardAmount.length; i++) {
        let valueInWei = Web3.utils.toWei(rewardAmount[i].toString(), 'ether');
        rewardAmount[i] = valueInWei;
      }
      logger.info(`Convert reward amount wei: ${rewardAmount}`);
      logger.info(`userIDs , ${userIDs}`);
      // Fetch user wallet data for each user involved in the distribution
      for (const userId of userIDs) {
        const userWallets = [userIDDB, userId];
        const queryToGetUserWallets = 'SELECT user_wallet FROM get_user($1,$2)';
        const userDetails = await this.dbConnection.query(
          queryToGetUserWallets,
          userWallets,
        );
        const userdata = userDetails.map((item) => item.user_wallet);
        const IsWalletAddressCorrect = this.isEthereumAddressValid(userdata);
        logger.info(`IsWalletAddressCorrect is ${IsWalletAddressCorrect}`);
        logger.info(`userId , ${userId}`);
        if (IsWalletAddressCorrect != true) {
          incorrectWalletAddress = userId;
          throw new Error(
            `Wallet address provided by this userId: ${incorrectWalletAddress} is not correct`,
          );
        }
        userWalletExtracted.push(userdata);
      }
      const rewardDistributionNotification =
        this.telegramService.sendNotification(
          `Reward distribution processes initiated:`,
        );
      logger.info(
        `Sending notification for starting reward distribution process: ${rewardDistributionNotification}`,
      );

      const walltes = userWalletExtracted;
      const userWalletArray = walltes.flatMap((wallet) => wallet);
      // Encode the contract method for reward distribution
      const method = await contract.methods.rewardDistributionInbatch(
        rewardAmount,
        userWalletArray,
      );
      const gasPriceMultiplier = process.env.GAS_MULTIPLIER; // Adjust this multiplier as needed
      const data = await method.encodeABI();
      const gasPrice = await web3.eth.getGasPrice();
      const increasedGasPrice = Math.floor(
        gasPrice * Number(gasPriceMultiplier),
      );
      logger.info(`increasedGasPrice is ${increasedGasPrice}`);
      // Estimate gas for the transaction
      const estimatedGas = await contract.methods
        .rewardDistributionInbatch(rewardAmount, userWalletArray)
        .estimateGas({
          from: fromAddressReward,
          to: rewardSmartContract,
        });
      logger.info(`estimatedGas is ${estimatedGas}`);
      // Construct and sign the transaction
      const tx = {
        gas: estimatedGas + gasBuffer,
        gasPrice: increasedGasPrice,
        to: rewardSmartContract,
        data,
      };
      const signedTx = await web3.eth.accounts.signTransaction(
        tx,
        privateKeyReward,
      );
      const txReceipt = await web3.eth.sendSignedTransaction(
        signedTx.rawTransaction,
      );

      logger.info(`txReceipt ,${txReceipt}`);
      const receipt = await web3.eth.getTransactionReceipt(
        txReceipt.transactionHash,
      );
      logger.info(`receipt ', ${receipt}`);
      const gasUsed = receipt.effectiveGasPrice;
      logger.info(`gasUsed , ${gasUsed}`);

      const gasUsedString = gasUsed.toString();
      logger.info(`gas used in string , ${gasUsedString}`);

      logger.info(
        `Transaction hash to check reward distribution: ${txReceipt.transactionHash}`,
      );

      // Process event logs for succeeded and failed reward distribution
      for (const log of receipt.logs) {
        // ... (fetch and process event logs)
        const eventToGetSucceedRewardDistribution =
          await contract.getPastEvents('succeededRewardDistribution', {
            fromBlock: receipt.blockNumber,
            toBlock: receipt.blockNumber,
            filter: {
              address: rewardSmartContract,
              topics: log.topics,
            },
          });

        succeededRecipients =
          eventToGetSucceedRewardDistribution[0].returnValues
            .succeededRecipient;

        const eventToGetFailedRewardDistribution = await contract.getPastEvents(
          'failedRewardDistribution',
          {
            fromBlock: receipt.blockNumber,
            toBlock: receipt.blockNumber,
            filter: {
              address: rewardSmartContract,
              topics: log.topics,
            },
          },
        );

        failedRecipients =
          eventToGetFailedRewardDistribution[0].returnValues.failedRecipient;
      }
      this.succeededRewardAddress.addUserAddress(succeededRecipients);
      this.failededRewardAddress.addUserAddress(failedRecipients);
      const succeeded = this.succeededRewardAddress.userAddresses;
      const succeededRewardAddress = succeeded.flatMap((wallet) => wallet);
      this.succeededRewardAddress.deleteAddresses();

      const userWalletDB = await getConstantValue(
        this.dbConnection,
        'user_wallet',
      );
      logger.info(`Constant value to get user ID is ${userWalletDB}`);
      logger.info(`succeededRewardAddress , ${succeededRewardAddress}`);

      // Update reward status for successfully distributed rewards
      for (const recipient of succeededRewardAddress) {
        // ... (update reward status)
        logger.info(`recipient , ${recipient.toLowerCase()}`);

        const queryToGetUserIds = 'SELECT * FROM public.get_user($1, $2)';
        const values = [userWalletDB, recipient.toLowerCase()];
        const userIDs = await this.dbConnection.query(
          queryToGetUserIds,
          values,
        );
        
        console.log('userIDs', userIDs);
        logger.info(`userIDs , ${userIDs}`);

        const userId = userIDs.map((item) => item.user_id);
        logger.info(`userId , ${userId}`);
        logger.info(`mappedRewardIdWithUserId , ${mappedRewardIdWithUserId}`);
        console.log('mappedRewardIdWithUserId',mappedRewardIdWithUserId);

        const fetchingRewardIdToChangeStatus = mappedRewardIdWithUserId.filter(
          (rewardId) => rewardId.userId === userId[0],
        );
        console.log('fetchingRewardIdToChangeStatus',fetchingRewardIdToChangeStatus);
        logger.info(
          `fetchingRewardIdToChangeStatus,
          ${fetchingRewardIdToChangeStatus}`,
        );

        for (let i = 0; i < fetchingRewardIdToChangeStatus.length; i++) {
          const valueBy = fetchingRewardIdToChangeStatus[i].rewardId;
          logger.info(`Reward Id is ${valueBy}`);
          console.log('valueBy', valueBy);
          const queryToPutNotificationStatus = `CALL put_user_nft_reward_by_id('{"${rewardNotificationConstant}": false}'::jsonb, '${valueBy}' )`;
          console.log(
            'queryToPutNotificationStatus',
            queryToPutNotificationStatus,
          );
          logger.info(
            `queryToPutNotificationStatus: ${queryToPutNotificationStatus}`,
          );
          const updateRewardNotification = await this.dbConnection.query(
            queryToPutNotificationStatus,
          );
          logger.info(`updateRewardNotification: ${updateRewardNotification}`);
          const queryToPutRewardStatus = `CALL put_user_nft_reward_by_id('{"${rewardDistributedConstant}": true}'::jsonb, '${valueBy}' )`;
          logger.info(`queryToPutRewardStatus: ${queryToPutRewardStatus}`);
          const updateRewardStatus = await this.dbConnection.query(
            queryToPutRewardStatus,
          );
          logger.info(`updateRewardStatus: ${updateRewardStatus}`);
          const queryToUpdateMessage = `CALL put_user_nft_reward_by_id('{"${messageConstant}": "Reward Distributed"}'::jsonb, '${valueBy}' )`;
          const updateMessage = await this.dbConnection.query(
            queryToUpdateMessage,
          );
          logger.info(`updateMessage: ${updateMessage}`);
          const queryToUpdateTxnHash = `CALL put_user_nft_reward_by_id('{"${txnHashConstant}": "${txReceipt.transactionHash}"}'::jsonb, '${valueBy}' )`;
          logger.info(`queryToUpdateTxnHash , ${queryToUpdateTxnHash}`);
          const updateTxnHash = await this.dbConnection.query(
            queryToUpdateTxnHash,
          );
          logger.info(`updateTxnHash: ${updateTxnHash}`);

          const queryToUpdateGasUsed = `CALL put_user_nft_reward_by_id('{"${gasUsedConstant}": "${gasUsedString}"}'::jsonb, '${valueBy}' )`;
          logger.info(`queryToUpdateGasUsed , ${queryToUpdateGasUsed}`);
          const updateGasUsed = await this.dbConnection.query(
            queryToUpdateGasUsed,
          );
          logger.info(`updateGasUsed: ${updateGasUsed}`);

          const currentTime = dayjs().format('YYYY-MM-DD HH:mm:ss.SSSSSS');
          logger.info(`currentTime: ${currentTime}`);

          const queryToUpdateUpdateTime = `UPDATE t_user_nft_reward SET updated_at = '${currentTime}' WHERE id = '${valueBy}'`;
          logger.info(`queryToUpdateUpdateTime , ${queryToUpdateUpdateTime}`);
          const updateUpdateTime = await this.dbConnection.query(
            queryToUpdateUpdateTime,
          );
          logger.info(`updateUpdateTime: ${updateUpdateTime}`);
        }
      }
      userWalletExtracted.splice(0, userWalletExtracted.length);

      const trxHashValue = await getConstantValue(
        this.dbConnection,
        'trx_hash',
      );
      const query = `select * from get_user_nft_reward('${trxHashValue}','${txReceipt.transactionHash}')`;
      const userIdValue = await getConstantValue(this.dbConnection, 'user_id');
      const usersQuery = await this.dbConnection.query(query);
      if (usersQuery.length > 0) {
        const usersName = [];
        for (let user = 0; user < usersQuery.length; user++) {
          const userId = `select first_name,email from get_user('${userIdValue}','${usersQuery[user].user_id}')`;
          const userDetails = await this.dbConnection.query(userId);
          const obj = [userDetails[0].first_name, userDetails[0].email];
          usersName.push(obj);
        }
        console.log('usersName', usersName);

        const formattedNamesSet = new Set();

        for (let i = 0; i < usersName.length; i++) {
          const formattedName = `${usersName[i][0]} [${usersName[i][1]}]`;
          formattedNamesSet.add(formattedName);
        }

        logger.info('usersName', usersName);
        // const formattedNames = usersName.map(
        //   (name, index) => `\n${index + 1}. ${name}`,
        // );
        const formattedNames = new Set();
        let finalresult = '\n';
        let i = 0;
        for (const value of formattedNamesSet) {
          finalresult = `
          ${i + 1}. ${value}`;
          console.log('finalresult', finalresult);
          // const output_string = finalresult.replace(',', '')
          // console.log('output_string',output_string);
          formattedNames.add(finalresult);
          finalresult = '';
          i++;
        }
        let s = '';
        for (const value of formattedNames) {
          console.log(value);
          s = s + value;
          s = s + ``;
        }

        console.log('formattedNames', formattedNames);

        console.log('s', s);

        // const finalresult = formattedNames.join(',\n');
        console.log('finalresult', s);
        const scenario = 'Scenario: Distribution Process Summary';
        const transactionHash = `Transaction Hash:${txReceipt.transactionHash}`;
        const successfullyDistributed = `Successfully distributed Sales commission for ${formattedNames.size} users`;
        const userDetails = `Name [Email]:${s}`;
        const notify =
          scenario +
          '\n' +
          '\n' +
          transactionHash +
          '\n' +
          '\n' +
          successfullyDistributed +
          '\n' +
          '\n' +
          userDetails;
        const rewardDistributionNotificationOfUser =
          this.telegramService.sendNotification(notify);

        logger.info(
          `Sending notification to users for reward distribution: ${rewardDistributionNotificationOfUser}`,
        );
      }

      if (rewardDataUserNotBoughtNFT.length > 0) {
        for (let i = 0; i < rewardDataUserNotBoughtNFT.length; i++) {
          const queryToUpdateMessageForNotRewardDistribution = `UPDATE t_user_nft_reward SET message = 'User has not purchased any NFT' WHERE id = '${rewardDataUserNotBoughtNFT[i].id}'`;
          const toUpdateMessageForNotRewardDistribution =
            await this.dbConnection.query(
              queryToUpdateMessageForNotRewardDistribution,
            );
          logger.info(
            `toUpdateMessageForNotRewardDistribution:
            ${toUpdateMessageForNotRewardDistribution}`,
          );
        }
      }

      await delay(10000);
      const rewardDistributionEndNotification =
        this.telegramService.sendNotification(
          `Reward distribution processes completed:`,
        );
      logger.info(
        `Sending notification for ending reward distribution process: ${rewardDistributionEndNotification}`,
      );

      for (let i = 0; i < incorrectRewardData.length; i++) {
        const id = incorrectRewardData[i].id;
        const queryToPutRewardStatus = `CALL put_user_nft_reward_by_id('{"${rewardDistributedConstant}": true}'::jsonb, '${id}' )`;
        const updateRewardStatus = await this.dbConnection.query(
          queryToPutRewardStatus,
        );
        logger.info(`updateRewardStatus: ${updateRewardStatus}`);
        const queryToUpdateMessage = `CALL put_user_nft_reward_by_id('{"${messageConstant}": "Reward amount is 0, cannot distrbute it"}'::jsonb, '${id}`;
        const updateMessage = await this.dbConnection.query(
          queryToUpdateMessage,
        );
        logger.info(`updateMessage: ${updateMessage}`);
      }
      //send received email notofication to user
      logger.info(
        'initialized direct sales reward received email notification',
      );
      await this.emailNotification.directSalesRewardRecived();
      logger.info('completed direct sales reward received email notification');
      await delay(5000);
      logger.info(
        'initialized indirect sales reward received email notification',
      );
      await this.emailNotification.indirectSalesRewardReceived();
      logger.info(
        'completed indirect sales reward received email notification',
      );

      // Return the transaction hash and distributed reward addresses
      return {
        TransactionHash: txReceipt.transactionHash,
        RewardDistributedTo: succeededRewardAddress,
      };
    } catch (error) {
      logger.error(`Error message: ${error.message}`);
      throw error;
    }
  }

  async walletBalance(walletAddress: string) {
    logger.info(`walletBalance function initiated---`);
    try {
      const response = await Moralis.EvmApi.balance.getNativeBalance({
        chain: process.env.CHAIN_MORALIS,
        address: walletAddress,
      });
      logger.info(`Moralis API worked!`);
      const balance = Web3.utils.fromWei(response.raw.balance, 'ether');
      return balance;
    } catch (error) {
      logger.error(error.message);
      throw new Error(error.message);
    }
  }

  async addFundsForBonus(Funds) {
    logger.info(`AddFundsForBonus API initiated--`);
    logger.info(`Request to add fund: ${Funds}`);
    const fundsInWeiAmount = Web3.utils.toWei(Funds.toString(), 'ether');
    logger.info(`fundsInWeiAmount: ${fundsInWeiAmount}`);
    let addedFundEvent: string;
    const web3 = new Web3(process.env.RPC_URL_TO_CONNECT_NODE);

    try {
      // Load ABI and instantiate the contract
      const abi = fs.readFileSync(
        join(process.cwd(), './src/smartContract/usdt.abi'),
      );
      const contract = new web3.eth.Contract(
        JSON.parse(abi.toString()),
        usdtSmartContract,
      );

      // Encode the contract method for adding funds
      const method = await contract.methods.transfer(
        rewardSmartContract,
        fundsInWeiAmount,
      );
      const gasPriceMultiplier = process.env.GAS_MULTIPLIER; // Adjust this multiplier as needed
      const data = await method.encodeABI();
      const gasPrice = await web3.eth.getGasPrice();
      const increasedGasPrice = Math.floor(
        gasPrice * Number(gasPriceMultiplier),
      );

      // Estimate gas for the transaction
      const estimatedGas = await contract.methods
        .transfer(rewardSmartContract, fundsInWeiAmount)
        .estimateGas({
          from: fromAddressReward,
          to: rewardSmartContract,
        });

      // Construct and sign the transaction
      const tx = {
        gas: estimatedGas + gasBuffer,
        gasPrice: increasedGasPrice,
        to: usdtSmartContract,
        data,
      };
      const signedTx = await web3.eth.accounts.signTransaction(
        tx,
        privateKeyReward,
      );
      const txReceipt = await web3.eth.sendSignedTransaction(
        signedTx.rawTransaction,
      );
      const receipt = await web3.eth.getTransactionReceipt(
        txReceipt.transactionHash,
      );

      // Process event logs for added funds
      for (const log of receipt.logs) {
        logger.info(`log, ${log}`);
        const eventToAddFunds = await contract.getPastEvents('Transfer', {
          fromBlock: receipt.blockNumber,
          toBlock: receipt.blockNumber,
          filter: {
            address: usdtSmartContract,
            topics: log.topics,
          },
        });
      }

      // Convert and return event data
      let eventsForAddFunds;
      if (typeof addedFundEvent === 'string') {
        eventsForAddFunds = JSON.parse(addedFundEvent);
      } else {
        eventsForAddFunds = addedFundEvent;
      }

      return {
        TransactionHash: txReceipt.transactionHash,
        Funds: Funds,
      };
    } catch (error) {
      logger.error(`Error message: ${error.message}`);
      throw new Error(
        `Error sending smart contract transaction: ${error.message}`,
      );
    }
  }

  async addFunds(Funds) {
    logger.info(`AddFunds API initiated--`);
    logger.info(`Request to add fund: ${Funds}`);
    const fundsInWeiAmount = Web3.utils.toWei(Funds.toString(), 'ether');
    logger.info(`fundsInWeiAmount: ${fundsInWeiAmount}`);
    let addedFundEvent: string;
    const web3 = new Web3(process.env.RPC_URL_TO_CONNECT_NODE);

    try {
      // Load ABI and instantiate the contract
      const abi = fs.readFileSync(
        join(process.cwd(), './src/smartContract/reward.abi'),
      );
      const contract = new web3.eth.Contract(
        JSON.parse(abi.toString()),
        rewardSmartContract,
      );

      // Encode the contract method for adding funds
      const method = await contract.methods.addFunds();
      const gasPriceMultiplier = process.env.GAS_MULTIPLIER; // Adjust this multiplier as needed
      const data = await method.encodeABI();
      const gasPrice = await web3.eth.getGasPrice();
      const increasedGasPrice = Math.floor(
        gasPrice * Number(gasPriceMultiplier),
      );

      // Estimate gas for the transaction
      const estimatedGas = await contract.methods.addFunds().estimateGas({
        from: fromAddressReward,
        to: rewardSmartContract,
        value: fundsInWeiAmount,
      });

      // Construct and sign the transaction
      const tx = {
        gas: estimatedGas + gasBuffer,
        gasPrice: increasedGasPrice,
        to: rewardSmartContract,
        value: fundsInWeiAmount,
        data,
      };
      const signedTx = await web3.eth.accounts.signTransaction(
        tx,
        privateKeyReward,
      );
      const txReceipt = await web3.eth.sendSignedTransaction(
        signedTx.rawTransaction,
      );
      const receipt = await web3.eth.getTransactionReceipt(
        txReceipt.transactionHash,
      );

      // Process event logs for added funds
      for (const log of receipt.logs) {
        const eventToAddFunds = await contract.getPastEvents('addedFund', {
          fromBlock: receipt.blockNumber,
          toBlock: receipt.blockNumber,
          filter: {
            address: rewardSmartContract,
            topics: log.topics,
          },
        });

        addedFundEvent = eventToAddFunds[0].returnValues;
      }

      // Convert and return event data
      let eventsForAddFunds;
      if (typeof addedFundEvent === 'string') {
        eventsForAddFunds = JSON.parse(addedFundEvent);
      } else {
        eventsForAddFunds = addedFundEvent;
      }

      return {
        TransactionHash: txReceipt.transactionHash,
        WalletAddress: eventsForAddFunds.walletAddress,
        Funds: eventsForAddFunds.fund,
      };
    } catch (error) {
      logger.error(`Error message: ${error.message}`);
      throw new Error(
        `Error sending smart contract transaction: ${error.message}`,
      );
    }
  }

  async mintNFT(mintNFT_dto: mintNFT_Dto) {
    logger.info(`mintNFT function initiated---`);
    const { TokenId, walletAddress } = mintNFT_dto;
    const web3 = new Web3(process.env.RPC_URL_TO_CONNECT_NODE);

    try {
      // Load ABI and instantiate the contract
      const abi = fs.readFileSync(
        join(process.cwd(), './src/smartContract/ibba.abi'),
      );
      const contract = new web3.eth.Contract(
        JSON.parse(abi.toString()),
        ibbaSmartContract,
      );

      // Encode the contract method for adding funds
      const method = await contract.methods.mintingByTokenId(
        TokenId,
        walletAddress,
      );
      const gasPriceMultiplier = process.env.GAS_MULTIPLIER; // Adjust this multiplier as needed
      const data = await method.encodeABI();
      const gasPrice = await web3.eth.getGasPrice();
      const increasedGasPrice = Math.floor(
        gasPrice * Number(gasPriceMultiplier),
      );

      // Estimate gas for the transaction
      const estimatedGas = await contract.methods
        .mintingByTokenId(TokenId, walletAddress)
        .estimateGas({
          from: fromAddressMint,
          to: ibbaSmartContract,
        });

      // Construct and sign the transaction
      const tx = {
        gas: estimatedGas + gasBuffer,
        gasPrice: increasedGasPrice,
        to: ibbaSmartContract,
        data,
      };
      const signedTx = await web3.eth.accounts.signTransaction(
        tx,
        privateKeyMint,
      );
      const txReceipt = await web3.eth.sendSignedTransaction(
        signedTx.rawTransaction,
      );
      const receipt = await web3.eth.getTransactionReceipt(
        txReceipt.transactionHash,
      );
      let eventToGetNFTIDs;
      for (const log of receipt.logs) {
        // ... (fetch and process event logs)
        eventToGetNFTIDs = await contract.getPastEvents('MintNFT', {
          fromBlock: receipt.blockNumber,
          toBlock: receipt.blockNumber,
          filter: {
            address: ibbaSmartContract,
            topics: log.topics,
          },
        });
      }
      let nftId = eventToGetNFTIDs[0].returnValues.nftId;

      const query = 'CALL post_nft($1, $2, $3)';
      const values = [nftId, ibbaSmartContract, 'admin'];

      await this.dbConnection.query(query, values);

      return receipt;
    } catch (error) {
      throw new Error(
        `Error sending smart contract transaction: ${error.message}`,
      );
    }
  }

  async mintNFTInBatch(mintNFTInBatch_dto: mintNFTInBatch_Dto) {
    logger.info(`mintNFTInBatch function initiated---`);
    const { TokenIds, NumberOfNFTsToMint } = mintNFTInBatch_dto;
    const web3 = new Web3(process.env.RPC_URL_TO_CONNECT_NODE);

    try {
      // Load ABI and instantiate the contract
      const abi = fs.readFileSync(
        join(process.cwd(), './src/smartContract/ibba.abi'),
      );
      const contract = new web3.eth.Contract(
        JSON.parse(abi.toString()),
        ibbaSmartContract,
      );

      // Encode the contract method for adding funds
      const method = await contract.methods.batchMintingByPassingTokenIds(
        NumberOfNFTsToMint,
        TokenIds,
      );
      const gasPriceMultiplier = process.env.GAS_MULTIPLIER; // Adjust this multiplier as needed
      const data = await method.encodeABI();
      const gasPrice = await web3.eth.getGasPrice();
      const increasedGasPrice = Math.floor(
        gasPrice * Number(gasPriceMultiplier),
      );

      // Estimate gas for the transaction
      const estimatedGas = await contract.methods
        .batchMintingByPassingTokenIds(NumberOfNFTsToMint, TokenIds)
        .estimateGas({
          from: fromAddressMint,
          to: ibbaSmartContract,
        });

      // Construct and sign the transaction
      const tx = {
        gas: estimatedGas + gasBuffer,
        gasPrice: increasedGasPrice,
        to: ibbaSmartContract,
        data,
      };
      const signedTx = await web3.eth.accounts.signTransaction(
        tx,
        privateKeyMint,
      );
      const txReceipt = await web3.eth.sendSignedTransaction(
        signedTx.rawTransaction,
      );
      const receipt = await web3.eth.getTransactionReceipt(
        txReceipt.transactionHash,
      );
      let eventToGetNFTIDs;
      for (const log of receipt.logs) {
        // ... (fetch and process event logs)
        eventToGetNFTIDs = await contract.getPastEvents('BatchMinted', {
          fromBlock: receipt.blockNumber,
          toBlock: receipt.blockNumber,
          filter: {
            address: ibbaSmartContract,
            topics: log.topics,
          },
        });
      }

      let tokenIds = await eventToGetNFTIDs[0].returnValues.tokenIds;
      if (tokenIds[0] == 0) {
        throw new Error(`NFTs already minted!`);
      }

      for (let i = 0; i < tokenIds.length; i++) {
        const query = 'CALL post_nft($1, $2, $3)';
        const values = [tokenIds[i], ibbaSmartContract, 'admin'];
        await this.dbConnection.query(query, values);
      }

      return receipt;
    } catch (error) {
      throw new Error(
        `Error sending smart contract transaction: ${error.message}`,
      );
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_11PM)
  async bonusDistribution() {
    logger.info(`bonusDistribution function initiated---`);
    let userWalletExtracted: string[] = [];
    let receipt: string;
    let totalBonusAmount = 0;

    const web3 = new Web3(process.env.RPC_URL_TO_CONNECT_NODE);
    try {
      // Load ABI and instantiate the contract
      const abi = fs.readFileSync(
        join(process.cwd(), './src/smartContract/reward.abi'),
      );

      const contract = new web3.eth.Contract(
        JSON.parse(abi.toString()),
        rewardSmartContract,
      );

      // Fetch reward data for distribution
      const queryToGetBonusData =
        'SELECT * FROM public.get_undistributed_bonus()';
      const bonusData = await this.dbConnection.query(queryToGetBonusData);
      // Handle case when no reward data is available
      logger.info(`bonus data, ${bonusData}`);

      if (bonusData.length < 1) {
        throw new Error('There is no data for bonus distribution');
      }

      let bonusDataUserBoughtNFT = [];
      let bonusDataUserNotBoughtNFT = [];

      for (let i = 0; i < bonusData.length; i++) {
        const queryToCheckUserHasBoughtNFTOrNot = `SELECT is_nft_purchased FROM m_users WHERE user_id = '${bonusData[i].user_id}'`;
        const toCheckUserHasBoughtNFTOrNot = await this.dbConnection.query(
          queryToCheckUserHasBoughtNFTOrNot,
        );
        logger.info(
          `toCheckUserHasBoughtNFTOrNot:
          ${toCheckUserHasBoughtNFTOrNot[0].is_nft_purchased}`,
        );
        if (toCheckUserHasBoughtNFTOrNot[0].is_nft_purchased == false) {
          bonusDataUserNotBoughtNFT.push(bonusData[i]);
        } else {
          bonusDataUserBoughtNFT.push(bonusData[i]);
        }
      }
      logger.info(`bonusDataUserNotBoughtNFT: ${bonusDataUserNotBoughtNFT}`);
      logger.info(`bonusDataUserBoughtNFT: ${bonusDataUserBoughtNFT}`);

      // Extract relevant data for distribution
      const badgeId = bonusDataUserBoughtNFT.map((item) => item.id);
      const userIDs = bonusDataUserBoughtNFT.map((item) => item.user_id);
      const bounsAmount = bonusDataUserBoughtNFT.map(
        (item) => item.user_bonus_amount,
      );

      let totalBonusAmountInWei = Web3.utils.toWei(
        totalBonusAmount.toString(),
        'ether',
      );
      logger.info(`totalBonusAmountInWei is ${totalBonusAmountInWei}`);
      logger.info(`bonusAmount is ${bounsAmount}`);
      for (const i of bounsAmount) {
        totalBonusAmountInWei = Number(totalBonusAmountInWei) + Number(i);
      }
      const bonusAmountInWei = Web3.utils.toWei(
        totalBonusAmountInWei.toString(),
        'ether',
      );

      logger.info(`totalBonusAmountInWei is ${bonusAmountInWei}`);
      const bonusAmountInETH = Web3.utils.fromWei(
        bonusAmountInWei.toString(),
        'ether',
      );

      // Check if smart contract balance is sufficient for distribution
      const checkUSDTSmartContractBalance = await this.checkBonusBalance();
      const balanceInUSDTSMCInETH = Web3.utils.fromWei(
        checkUSDTSmartContractBalance.Current_Value,
        'ether',
      );
      logger.info(
        `checkUSDTSmartContractBalance, ${checkUSDTSmartContractBalance}`,
      );
      logger.info(`balanceInUSDTSMCInETH is ${balanceInUSDTSMCInETH}`);
      logger.info(`bonusAmountInETH is ${bonusAmountInETH}`);

      if (bonusAmountInETH >= balanceInUSDTSMCInETH) {
        let walletFund = await this.moralisService.usdtWalletBalanceBonus(
          process.env.FROM_ADDRESS,
        );
        logger.info(`walletFund is ${walletFund}`);
        const walletBalance = walletFund.WalletBalance;
        const totalBonusAmount =
          Number(balanceInUSDTSMCInETH) + Number(walletBalance);
        logger.info(`totalBonusAmount is ${totalBonusAmount}`);

        if (totalBonusAmount > bonusAmountInETH) {
          const percentage = Number(process.env.GAS_FEE_REQUIRED_PERCENTAGE); // 10%
          let value = (percentage / 100) * Number(walletBalance);
          let valueToBeAdd = Number(walletBalance) - Number(value);
          logger.info(`valueToBeAdd, ${valueToBeAdd}`);
          logger.info(`Adding funds in reward smart contract: ${valueToBeAdd}`);
          const result = await this.addFundsForBonus(valueToBeAdd);
          logger.info(`Details: ${result}`);
        } else if (totalBonusAmount < bonusAmountInETH) {
          return {
            Message: 'Funds in custodial wallet is not sufficient for reward',
            FundsInCustodialWallet: walletBalance,
            FundsRequiredForReward: bonusAmountInETH,
          };
        }
      }

      // Map reward IDs to user IDs for batch processing
      const mappedBadgeIdWithUserId = badgeId.map((badgeId, index) => ({
        badgeId,
        userId: userIDs[index],
      }));

      logger.info(`mappedBadgeIdWithUserId, ${mappedBadgeIdWithUserId}`);

      const userIDDB = await getConstantValue(this.dbConnection, 'user_id');

      // Fetch user wallet data for each user involved in the distribution
      for (const userId of userIDs) {
        const userWallets = [userIDDB, userId];

        const queryToGetUserWallets = 'SELECT user_wallet FROM get_user($1,$2)';
        const userDetails = await this.dbConnection.query(
          queryToGetUserWallets,
          userWallets,
        );

        const userdat = userDetails.map((item) => item.user_wallet);
        userWalletExtracted.push(userdat);
      }

      const walltes = userWalletExtracted;
      const userWalletArray = walltes.flatMap((wallet) => wallet);

      logger.info(`userWalletArray, ${userWalletArray}`);

      for (let i = 0; i < bounsAmount.length; i++) {
        let valueInWei = Web3.utils.toWei(bounsAmount[i].toString(), 'ether');
        bounsAmount[i] = valueInWei;
      }

      for (let i = 0; i < userWalletArray.length; i++) {
        const method = await contract.methods.transferUSDT(
          userWalletArray[i],
          bounsAmount[i],
        );
        const gasPriceMultiplier = process.env.GAS_MULTIPLIER; // Adjust this multiplier as needed
        const data = await method.encodeABI();
        const gasPrice = await web3.eth.getGasPrice();
        const increasedGasPrice = Math.floor(
          gasPrice * Number(gasPriceMultiplier),
        );
        // Estimate gas for the transaction

        const estimatedGas = await contract.methods
          .transferUSDT(userWalletArray[i], bounsAmount[i])
          .estimateGas({
            from: fromAddressReward,
            to: rewardSmartContract,
          });

        // Construct and sign the transaction
        const tx = {
          gas: estimatedGas + gasBuffer,
          gasPrice: increasedGasPrice,
          to: rewardSmartContract,
          data,
        };
        const signedTx = await web3.eth.accounts.signTransaction(
          tx,
          privateKeyReward,
        );
        const txReceipt = await web3.eth.sendSignedTransaction(
          signedTx.rawTransaction,
        );

        const receipt = await web3.eth.getTransactionReceipt(
          txReceipt.transactionHash,
        );

        logger.info(`receipt: ${receipt}`);
        const gasUsed = receipt.effectiveGasPrice;
        logger.info(`gasUsed , ${gasUsed}`);
        const gasUsedString = gasUsed.toString();
        logger.info(`gas used in string , ${gasUsedString}`);

        logger.info(`users Ids, ${userIDs[i]}`);
        const badgeId = await this.getBadgeIdByUserId(
          mappedBadgeIdWithUserId,
          userIDs[i],
        );

        if (badgeId !== null) {
          logger.info(`Badge ID for user ${userIDs[i]}: ${badgeId}`);

          const bonusDistributed = await getConstantValue(
            this.dbConnection,
            'bonus_distributed',
          );

          const trxHash = await getConstantValue(this.dbConnection, 'trx_hash');
          const queryToPut = `CALL put_user_badge_status_by_id('{"${bonusDistributed}": true,"${trxHash}": "${txReceipt.transactionHash}"}'::jsonb,
         '${badgeId}' )`;
          const rewardNotificationConstant = await getConstantValue(
            this.dbConnection,
            'notification',
          );

          const queryToPutNotificationStatus = `CALL put_user_badge_status_by_id('{"${rewardNotificationConstant}": false}'::jsonb, '${badgeId}' )`;
          logger.info(
            `queryToPutNotificationStatus::::::::: ${queryToPutNotificationStatus}`,
          );
          const updateRewardNotification = await this.dbConnection.query(
            queryToPutNotificationStatus,
          );
          logger.info(
            `updateRewardNotification::::::::::: ${updateRewardNotification}`,
          );
          const userDetails = await this.dbConnection.query(queryToPut);
          logger.info(`userDetails, ${userDetails}`);
          const queryToUpdateGasUsed = `UPDATE t_user_badges SET gas_fee = ${gasUsedString} WHERE id = '${badgeId}'`;
          logger.info(`queryToUpdateGasUsed , ${queryToUpdateGasUsed}`);
          const updateGasUsed = await this.dbConnection.query(
            queryToUpdateGasUsed,
          );
          const indexToRemove = mappedBadgeIdWithUserId.findIndex(
            (entry) => entry.badgeId === badgeId,
          );

          if (indexToRemove !== -1) {
            mappedBadgeIdWithUserId.splice(indexToRemove, 1);
          }
        } else {
          logger.info(`User ${userIDs[i]} not found.`);
        }
      }
      const WalletAddress = userWalletExtracted.flatMap(
        (innerArray) => innerArray,
      );

      if (bonusDataUserNotBoughtNFT.length > 0) {
        for (let i = 0; i < bonusDataUserNotBoughtNFT.length; i++) {
          const queryToUpdateMessageForNotBonusDistribution = `UPDATE t_user_badges SET message = 'User has not purchased any NFT' WHERE id = '${bonusDataUserNotBoughtNFT[i].id}'`;
          logger.info(
            `queryToUpdateMessageForNotBonusDistribution:
            ${queryToUpdateMessageForNotBonusDistribution}`,
          );
          const toUpdateMessageForNotBonusDistribution =
            await this.dbConnection.query(
              queryToUpdateMessageForNotBonusDistribution,
            );
          logger.info(
            `toUpdateMessageForNotBonusDistribution:
            ${toUpdateMessageForNotBonusDistribution}`,
          );
        }
      }
      logger.info('initialize bonus received email notification');
      await this.emailNotification.BonusReceived();
      logger.info('completed bonus received email notification');

      await delay(5000);
      logger.info('initialize upgraded bonus due email notification::::');
      await this.emailNotification.BonusUpgrade();
      logger.info('completed upgraded bonus due email notification::::');

      return {
        message: WalletAddress,
      };
    } catch (error) {
      throw error;
    }
  }

  async getBadgeIdByUserId(mappedBadgeIdWithUserId, targetUserId) {
    logger.info(`getBadgeIdByUserId function initiated---`);
    for (const mapping of mappedBadgeIdWithUserId) {
      if (mapping.userId === targetUserId) {
        return mapping.badgeId;
      }
    }
    return null; // Return null if the user ID is not found
  }
}
