import { IsInt, IsNotEmpty, IsPositive, Min } from 'class-validator';

export class AddFunds_Dto {
  @IsNotEmpty({ message: 'Amount cannot be empty' })
  @IsPositive({ message: 'Amount must be greater than 0' })
  @IsInt({ message: 'Please pass value as a integer' })
  Funds: number;
}
