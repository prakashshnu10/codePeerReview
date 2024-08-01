import { IsArray, IsEthereumAddress, IsInt, IsNotEmpty, IsPositive, Min } from 'class-validator';

export class mintNFT_Dto {
  @IsNotEmpty({ message: 'Amount cannot be empty' })
  @IsPositive({ message: 'Amount must be greater than 0' })
  @IsInt({ message: 'Please pass value as a integer' })
  TokenId: number;

  
  @IsNotEmpty({message:'Wallet address can not be empty!'})
  @IsEthereumAddress({message:'Invalid Wallet Address'})
  walletAddress: string;
}
