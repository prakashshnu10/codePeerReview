import { IsArray, IsEthereumAddress, IsInt, IsNotEmpty, IsPositive, Min } from 'class-validator';

export class mintNFTInBatch_Dto {
  @IsNotEmpty({ message: 'Amount cannot be empty' })
  @IsPositive({ message: ' must be greater than 0' })
  @IsInt({ message: 'Please pass value as a integer' })
  NumberOfNFTsToMint: number;

  @IsNotEmpty({ message: 'Amount cannot be empty' })
  @IsArray({message: 'Token Ids should be pass as an array'})
  TokenIds: number[];


}
