import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { Connection } from 'typeorm';
import logger from '../../helper/logger';

@Injectable()
export class EmailService {
  constructor(
    private mailerService: MailerService,
    private readonly dbConnection: Connection,
  ) {}

  async sendEmail(to: string, otp: string, firstname: string): Promise<void> {
    try {
      logger.info('EmailService');
      const CapFirstName =
        firstname.charAt(0).toUpperCase() + firstname.slice(1).toLowerCase();

      const template = `
  <html>
  <head>
  <style>
  body {
    font-family: Arial, sans-serif;
    background-color: #f6f6f6;
  }
  h1 {
    color: #444;
  }
  .otp-container {
    padding: 20px;
    background-color: #fff;
    border-radius: 5px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  }
  .otp-code {
    font-size: 24px;
    font-weight: bold;
    color: #0088cc;
    margin: 10px 0;
  }
  .info-text {
    font-size: 16px;
    color: #555;
  }
</style>
  </head>
  <body>
    <div class="otp-container">
      <h2>OTP Verification - MerkleTree</h2>
      <p class="info-text">Hello ${CapFirstName},</p>
      <p class="info-text">Thank you for choosing to register with MerkleTree. Please use the code below to complete your Sign Up procedure and verify your account.</p>
      <p class="otp-code">${otp}</p>
      <p class="info-text">Please do not share this code with anyone. If you did not request this email, you can safely ignore it.</p>
      <p class="info-text">Regards,</p>
      <p class="info-text">Team MerkleTree</p>
    </div>
  </body>
</html>
  `;

      await this.mailerService.sendMail({
        to: to,
        subject: 'OTP Verification- MerkleTree',
        html: template,
        text: `otp is ${otp}`,
      });
    } catch (e) {
      logger.error('EmailService::error', e);
      throw e;
    }
  }

  async sendEmailForgetForPassword(
    to: string,
    otp: string,
    firstname: string,
  ): Promise<void> {
    try {
      logger.info('sendEmailForgetForPassword');
      const CapFirstName =
        firstname.charAt(0).toUpperCase() + firstname.slice(1).toLowerCase();

      const template = `
  <html>
  <head>
  <style>
  body {
    font-family: Arial, sans-serif;
    background-color: #f6f6f6;
  }
  h1 {
    color: #444;
  }
  .otp-container {
    padding: 20px;
    background-color: #fff;
    border-radius: 5px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  }
  .otp-code {
    font-size: 24px;
    font-weight: bold;
    color: #0088cc;
    margin: 10px 0;
  }
  .info-text {
    font-size: 16px;
    color: #555;
  }
</style>
  </head>
  <body>
    <div class="otp-container">
      <h2>Reset Password - MerkleTree</h2>
      <p class="info-text">Hello ${CapFirstName},</p>
      <p class="info-text">We have received a request to reset the password for your MerkleTree account. To complete the password reset process, please use the verification code provided below:</p>
      <p class="otp-code">Verification Code: ${otp}</p>
      <p class="info-text">Please keep this code confidential and do not share it with anyone. If you did not initiate this password reset request, you can safely disregard this email.</p>
      <p class="info-text">If you have any questions or need further assistance, please do not hesitate to contact our support team.</p>
      <p class="info-text">Regards,</p>
      <p class="info-text">Team MerkleTree</p>
    </div>
  </body>
</html>
  `;

      await this.mailerService.sendMail({
        to: to,
        subject: 'Password Reset Request for Your MerkleTree Account',
        html: template,
        text: `otp is ${otp}`,
      });
      const query = `
      UPDATE m_users
      SET otp = $1
      WHERE email = $2
    `;
      await this.dbConnection.query(query, [otp, to]);
    } catch (e) {
      logger.error('sendEmailForgetForPassword::error', e);
      throw e;
    }
  }

  async sendEmailToAdmin(
    to: string,
    otp: string,
    firstname: string,
  ): Promise<void> {
    try {
      logger.info('sendEmailToAdmin');
      const CapFirstName =
        firstname.charAt(0).toUpperCase() + firstname.slice(1).toLowerCase();

      const template = `
  <html>
  <head>
  <style>
  body {
    font-family: Arial, sans-serif;
    background-color: #f6f6f6;
  }
  h1 {
    color: #444;
  }
  .otp-container {
    padding: 20px;
    background-color: #fff;
    border-radius: 5px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  }
  .otp-code {
    font-size: 24px;
    font-weight: bold;
    color: #0088cc;
    margin: 10px 0;
  }
  .info-text {
    font-size: 16px;
    color: #555;
  }
</style>
  </head>
  <body>
    <div class="otp-container">
      <h2>OTP Verification - MerkleTree</h2>
      <p class="info-text">Hello ${CapFirstName},</p>
      <p class="info-text">Thank you for choosing to login with MerkleTree. Please use the code below to complete your login procedure and verify your account.</p>
      <p class="otp-code">${otp}</p>
      <p class="info-text">Please do not share this code with anyone. If you did not request this email, you can safely ignore it.</p>
      <p class="info-text">Regards,</p>
      <p class="info-text">Team MerkleTree</p>
    </div>
  </body>
</html>
  `;

      await this.mailerService.sendMail({
        to: to,
        subject: 'OTP Verification- MerkleTree',
        html: template,
        text: `otp is ${otp}`,
      });
      const query = `
      UPDATE m_users
      SET otp = $1
      WHERE email = $2
    `;
      await this.dbConnection.query(query, [otp, to]);
    } catch (e) {
      logger.error('sendEmailToAdmin::error', e);
      throw e;
    }
  }

  async sendLowBalanceToAdmin(
    to: string,
    currentWalletBalance: string,
    fromWalletAddress: string,
    fixedWalletAddress: string,
  ): Promise<void> {
    try {
      logger.info('sendLowBalanceToAdmin');
      const template = `
  <html>
  <head>
  <style>
  body {
    font-family: Arial, sans-serif;
    background-color: #f6f6f6;
  }
  h1 {
    color: #444;
  }
  .otp-container {
    padding: 20px;
    background-color: #fff;
    border-radius: 5px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  }
  .otp-code {
    font-size: 24px;
    font-weight: bold;
    color: #0088cc;
    margin: 10px 0;
  }
  .info-text {
    font-size: 16px;
    color: #555;
  }
</style>
  </head>
  <body>
    <div class="otp-container">
      <h2>Wallet Balance</h2>
      <p class="info-text">Dear Admin,</p>
      <p class="info-text">This is to inform you that the custodial wallet balance has fallen below ${fixedWalletAddress}.</p>
      <p class="Wallet Balance Information:</p>
      <p class="info-text">- Current Balance: ${currentWalletBalance}</p>
      <p class="info-text">- Wallet Address: ${fromWalletAddress}</p>
      <p class="info-text">Action Required:,</p>
      <p class="info-text">We recommend topping up your wallet at your earliest convenience to avoid any interruptions in your account activity.</p>
      <p class="info-text">Thank you for your attention to this matter.</p>
    </div>
  </body>
</html>
  `;

      await this.mailerService.sendMail({
        to: to,
        subject: 'Low Wallet Balance Notification',
        html: template,
      });
    } catch (e) {
      logger.error('sendLowBalanceToAdmin', e);
      throw e;
    }
  }

  async sendMailToDirectSalesRewardDue(
    to: string,
    email: string,
    firstname: string,
    rewardAmount: number,
  ): Promise<void> {
    try {
      logger.info('sendMailToDirectSalesRewardDue');
      const CapFirstName =
        firstname.charAt(0).toUpperCase() + firstname.slice(1).toLowerCase();

      const template = `
  <html>
  <head>
  <style>
  body {
    font-family: Arial, sans-serif;
    background-color: #f6f6f6;
  }
  h1 {
    color: #444;
  }
  .otp-container {
    padding: 20px;
    background-color: #fff;
    border-radius: 5px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  }
  .otp-code {
    font-size: 24px;
    font-weight: bold;
    color: #0088cc;
    margin: 10px 0;
  }
  .info-text {
    font-size: 16px;
    color: #555;
  }
</style>
  </head>
  <body>
    <div class="otp-container">
     
      <p class="info-text"> 
      Exciting news! '${CapFirstName}' '${email}'  has purchased a new NFT. 
      You have earned a Direct Sales Reward of ${rewardAmount} ETH, which is on its way to your wallet..</p>
      <br/>
      <br/>
      <button onclick=redirectToMerkletree()>Claim Your Reward Now</button>

      <script>
          function redirectToMerkletree() {
              window.open(${process.env.MERKLETREE_URL}/dashboard/notification, "_blank");
          }
      </script>
      <p class="info-text">Regards,</p>
      <p class="info-text">Team MerkleTree</p>
    </div>
  </body>
</html>
  `;

      await this.mailerService.sendMail({
        to: to,
        subject: 'You have Earned a Direct Sales Reward! 🚀',
        html: template,
      });
    } catch (e) {
      logger.error('sendMailToDirectSalesRewardDue::error', e);
      throw e;
    }
  }

  async sendMailToDirectSalesRewardReceived(
    to: string,
    email: string,
    firstname: string,
    rewardAmount: number,
  ): Promise<void> {
    try {
      logger.info('sendMailToDirectSalesRewardReceived');
      const CapFirstName =
        firstname.charAt(0).toUpperCase() + firstname.slice(1).toLowerCase();

      const template = `
  <html>
  <head>
  <style>
  body {
    font-family: Arial, sans-serif;
    background-color: #f6f6f6;
  }
  h1 {
    color: #444;
  }
  .otp-container {
    padding: 20px;
    background-color: #fff;
    border-radius: 5px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  }
  .otp-code {
    font-size: 24px;
    font-weight: bold;
    color: #0088cc;
    margin: 10px 0;
  }
  .info-text {
    font-size: 16px;
    color: #555;
  }
</style>
  </head>
  <body>
    <div class="otp-container">
      <p class="info-text"> 
      Congratulations! You've received a direct sales reward of ${rewardAmount} ETH! Check it out now in your wallet.
      <br/>
      <br/>
      <button onclick=redirectToMerkletree()>Explore Your Reward</button>
      <script>
          function redirectToMerkletree() {
              window.open(${process.env.MERKLETREE_URL}/dashboard/notification, "_blank");
          }
      </script>
      <p class="info-text">Regards,</p>
      <p class="info-text">Team MerkleTree</p>
    </div>
  </body>
</html>
  `;

      await this.mailerService.sendMail({
        to: to,
        subject: 'Congratulations on Your Direct Sales Reward! 🎉',
        html: template,
      });
    } catch (e) {
      logger.error('sendMailToDirectSalesRewardReceived::error', e);
      throw e;
    }
  }

  async sendMailToIndirectSalesRewardDue(
    to: string,
    email: string,
    level: string,
    firstname: string,
    rewardAmount: number,
  ): Promise<void> {
    try {
      logger.info('sendMailToIndirectSalesRewardDue');
      const CapFirstName =
        firstname.charAt(0).toUpperCase() + firstname.slice(1).toLowerCase();

      const template = `
  <html>
  <head>
  <style>
  body {
    font-family: Arial, sans-serif;
    background-color: #f6f6f6;
  }
  h1 {
    color: #444;
  }
  .otp-container {
    padding: 20px;
    background-color: #fff;
    border-radius: 5px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  }
  .otp-code {
    font-size: 24px;
    font-weight: bold;
    color: #0088cc;
    margin: 10px 0;
  }
  .info-text {
    font-size: 16px;
    color: #555;
  }
</style>
  </head>
  <body>
    <div class="otp-container">
     
      <p class="info-text"> 
      Exciting news! '${CapFirstName} [Tier ${level}]' '${email}'  has purchased a new NFT. 
     You have earned an Indirect Sales Reward of ${rewardAmount} ETH, which is on its way to your wallet.</p>
     <br/>
     <br/>
      <button onclick=redirectToMerkletree()>Claim Your Reward Now</button>
      <script>
          function redirectToMerkletree() {
              window.open(${process.env.MERKLETREE_URL}/dashboard/notification, "_blank");
          }
      </script>
      <p class="info-text">Regards,</p>
      <p class="info-text">Team MerkleTree</p>
    </div>
  </body>
</html>
  `;

      await this.mailerService.sendMail({
        to: to,
        subject: 'Your Indirect Sales Reward is on Its Way! 🌟',
        html: template,
      });
    } catch (e) {
      logger.error('sendMailToIndirectSalesRewardDue::error', e);
      throw e;
    }
  }

  async sendMailToIndirectSalesRewardReceived(
    to: string,
    email: string,
    firstname: string,
    rewardAmount: number,
  ): Promise<void> {
    try {
      logger.info('sendMailToIndirectSalesRewardReceived');
      const CapFirstName =
        firstname.charAt(0).toUpperCase() + firstname.slice(1).toLowerCase();

      const template = `
  <html>
  <head>
  <style>
  body {
    font-family: Arial, sans-serif;
    background-color: #f6f6f6;
  }
  h1 {
    color: #444;
  }
  .otp-container {
    padding: 20px;
    background-color: #fff;
    border-radius: 5px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  }
  .otp-code {
    font-size: 24px;
    font-weight: bold;
    color: #0088cc;
    margin: 10px 0;
  }
  .info-text {
    font-size: 16px;
    color: #555;
  }
</style>
  </head>
  <body>
    <div class="otp-container">
      <p class="info-text"> 
      Congratulations! You've received an indirect sales reward of ${rewardAmount} ETH! Check it out now in your wallet.
      <br/>
      <br/>
      <button onclick=redirectToMerkletree()>Explore Your Reward</button>
      <script>
          function redirectToMerkletree() {
              window.open(${process.env.MERKLETREE_URL}/dashboard/notification, "_blank");
          }
      </script>
      <p class="info-text">Regards,</p>
      <p class="info-text">Team MerkleTree</p>
    </div>
  </body>
</html>
  `;

      await this.mailerService.sendMail({
        to: to,
        subject: 'You have Received an Indirect Sales Reward! 🎁',
        html: template,
      });
    } catch (e) {
      logger.error('sendMailToIndirectSalesRewardReceived::error', e);
      throw e;
    }
  }

  async sendMailToNftPurchased(to: string, nftName: number): Promise<void> {
    try {
      logger.info('sendMailToNftPurchased');
      const template = `
  <html>
  <head>
  <style>
  body {
    font-family: Arial, sans-serif;
    background-color: #f6f6f6;
  }
  h1 {
    color: #444;
  }
  .otp-container {
    padding: 20px;
    background-color: #fff;
    border-radius: 5px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  }
  .otp-code {
    font-size: 24px;
    font-weight: bold;
    color: #0088cc;
    margin: 10px 0;
  }
  .info-text {
    font-size: 16px;
    color: #555;
  }
</style>
  </head>
  <body>
    <div class="otp-container">
      <p class="info-text"> 
      Congratulations! Purchase of NFT '${nftName}' was completed successfully.
<br/>
<br/>
      <button onclick=redirectToMerkletree()>Explore Your New NFT</button>
      <script>
          function redirectToMerkletree() {
              window.open(${process.env.MERKLETREE_URL}/dashboard/notification, "_blank");
          }
      </script>
      <p class="info-text">Regards,</p>
      <p class="info-text">Team MerkleTree</p>
    </div>
  </body>
</html>
  `;

      await this.mailerService.sendMail({
        to: to,
        subject: `Successful NFT Purchase - '${nftName}' 🎨
        `,
        html: template,
      });
    } catch (e) {
      logger.error('sendMailToIndirectSalesRewardReceived::error', e);
      throw e;
    }
  }

  async sendMailToOneTimeBonusDue(
    to: string,
    badgeName: string,
    nftCount: number,
    bonusAmount: number,
  ): Promise<void> {
    try {
      logger.info('sendMailToOneTimeBonusDue');
      const template = `
  <html>
  <head>
  <style>
  body {
    font-family: Arial, sans-serif;
    background-color: #f6f6f6;
  }
  h1 {
    color: #444;
  }
  .otp-container {
    padding: 20px;
    background-color: #fff;
    border-radius: 5px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  }
  .otp-code {
    font-size: 24px;
    font-weight: bold;
    color: #0088cc;
    margin: 10px 0;
  }
  .info-text {
    font-size: 16px;
    color: #555;
  }
</style>
  </head>
  <body>
    <div class="otp-container">
      <p class="info-text"> 
      Congratulations, your immediate referees have purchased more than ${nftCount} NFTs.
      You are about to become an ${badgeName} and receive a one-time bonus of ${bonusAmount} USDT. Stay tuned for your rewards!
      <br />
      <br/>
      <button onclick=redirectToMerkletree()>Get Ready to Upgrade</button>
      <script>
          function redirectToMerkletree() {
              window.open(${process.env.MERKLETREE_URL}/dashboard/notification, "_blank");
          }
      </script>
      <p class="info-text">Regards,</p>
      <p class="info-text">Team MerkleTree</p>
    </div>
  </body>
</html>
  `;

      await this.mailerService.sendMail({
        to: to,
        subject: `Congratulations! ${badgeName} Status Awaits! 🏅
        `,
        html: template,
      });
    } catch (e) {
      logger.error('sendMailToOneTimeBonusDue::error', e);
      throw e;
    }
  }

  async sendMailToOneTimeBonusReceived(
    to: string,
    badgeName: string,
    nftCount: number,
    bonusAmount: number,
  ): Promise<void> {
    try {
      logger.info('sendMailToOneTimeBonusReceived');
      const template = `
  <html>
  <head>
  <style>
  body {
    font-family: Arial, sans-serif;
    background-color: #f6f6f6;
  }
  h1 {
    color: #444;
  }
  .otp-container {
    padding: 20px;
    background-color: #fff;
    border-radius: 5px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  }
  .otp-code {
    font-size: 24px;
    font-weight: bold;
    color: #0088cc;
    margin: 10px 0;
  }
  .info-text {
    font-size: 16px;
    color: #555;
  }
</style>
  </head>
  <body>
    <div class="otp-container">
      <p class="info-text"> 
      Congratulations! You've become an ${badgeName} and earned a one-time bonus of ${bonusAmount} USDT. View your rewards!
      <br />
      <br/>
      <button onclick=redirectToMerkletree()>View Your Rewards</button>
      <script>
          function redirectToMerkletree() {
              window.open(${process.env.MERKLETREE_URL}/dashboard/notification, "_blank");
          }
      </script>
      <p class="info-text">Regards,</p>
      <p class="info-text">Team MerkleTree</p>
    </div>
  </body>
</html>
  `;

      await this.mailerService.sendMail({
        to: to,
        subject: `You have Become an ${badgeName}! 🥳
        `,
        html: template,
      });
    } catch (e) {
      logger.error('sendMailToOneTimeBonusReceived::error', e);
      throw e;
    }
  }

  async sendMailToDailyRewardEarning(
    to: string,
    rewardAmount: number,
  ): Promise<void> {
    try {
      logger.info('sendMailToDailyRewardEarning');
      const template = `
  <html>
  <head>
  <style>
  body {
    font-family: Arial, sans-serif;
    background-color: #f6f6f6;
  }
  h1 {
    color: #444;
  }
  .otp-container {
    padding: 20px;
    background-color: #fff;
    border-radius: 5px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  }
  .otp-code {
    font-size: 24px;
    font-weight: bold;
    color: #0088cc;
    margin: 10px 0;
  }
  .info-text {
    font-size: 16px;
    color: #555;
  }
</style>
  </head>
  <body>
    <div class="otp-container">
      <p class="info-text"> 
      Get ready for a rewarding day! Your total reward of ${rewardAmount} ETH is on its way.
      <br/>
      <br/>
      <button onclick=redirectToMerkletree()>Claim Your Daily Reward</button>
      <script>
          function redirectToMerkletree() {
              window.open(${process.env.MERKLETREE_URL}/dashboard/notification, "_blank");
          }
      </script>
      <p class="info-text">Regards,</p>
      <p class="info-text">Team MerkleTree</p>
    </div>
  </body>
</html>
  `;

      await this.mailerService.sendMail({
        to: to,
        subject: `Get Ready for Your Daily Reward! 💰
        `,
        html: template,
      });
    } catch (e) {
      logger.error('sendMailToDailyRewardEarning::error', e);
      throw e;
    }
  }

  async sendMailToUpgradeOneTimeBonus(
    to: string,
    previousBadgeName: string,
    currentBadgeName: string,
    bonusAmount: number,
  ): Promise<void> {
    try {
      logger.info('sendMailToUpgradeOneTimeBonus');
      const template = `
  <html>
  <head>
  <style>
  body {
    font-family: Arial, sans-serif;
    background-color: #f6f6f6;
  }
  h1 {
    color: #444;
  }
  .otp-container {
    padding: 20px;
    background-color: #fff;
    border-radius: 5px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  }
  .otp-code {
    font-size: 24px;
    font-weight: bold;
    color: #0088cc;
    margin: 10px 0;
  }
  .info-text {
    font-size: 16px;
    color: #555;
  }
</style>
  </head>
  <body>
    <div class="otp-container">
      <p class="info-text"> 
      Exciting news! It's time to upgrade from ${previousBadgeName} to ${currentBadgeName} and earn a one-time bonus of ${bonusAmount} USDT.
      <br/>
      <br/>
      <button onclick=redirectToMerkletree()>Upgrade & Claim Bonus</button>
      <script>
          function redirectToMerkletree() {
              window.open(${process.env.MERKLETREE_URL}/dashboard/notification, "_blank");
          }
      </script>
      <p class="info-text">Regards,</p>
      <p class="info-text">Team MerkleTree</p>
    </div>
  </body>
</html>
  `;

      await this.mailerService.sendMail({
        to: to,
        subject: `Upgrade to ${currentBadgeName} & Earn ${bonusAmount} USDT Bonus! 🌟
        `,
        html: template,
      });
    } catch (e) {
      logger.error('sendMailToUpgradeOneTimeBonus::error', e);
      throw e;
    }
  }
}
