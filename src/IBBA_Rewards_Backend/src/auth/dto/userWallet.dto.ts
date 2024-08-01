import { IsEthereumAddress, IsNotEmpty } from 'class-validator';

export class ValidateUserWalletDto {
  @IsNotEmpty()
  @IsEthereumAddress()
  // eslint-disable-next-line @typescript-eslint/indent
  user_wallet: string;
}
