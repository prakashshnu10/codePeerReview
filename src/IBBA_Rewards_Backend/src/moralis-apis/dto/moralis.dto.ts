import { IsEthereumAddress, IsNotEmpty } from 'class-validator';

export class Moralis_Dto {
  @IsNotEmpty({message:'Token address can not be empty!'})
  @IsEthereumAddress({message:'Invalid Token Address'})
  tokenAddress: string;

  @IsNotEmpty({message:'Wallet address can not be empty!'})
  @IsEthereumAddress({message:'Invalid Wallet Address'})
  walletAddress: string;

  @IsNotEmpty()
  to_date: Date;

  @IsNotEmpty()
  from_date: Date;
}
