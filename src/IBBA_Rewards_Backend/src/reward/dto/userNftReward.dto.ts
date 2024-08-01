import { IsNotEmpty, IsString } from 'class-validator';
export class UserNftRewardDto {
  @IsNotEmpty()
  @IsString()
  readonly user_id: string;

  @IsNotEmpty()
  @IsString()
  readonly nft_id: string;

  @IsNotEmpty()
  readonly reward_id: string;

  @IsNotEmpty()
  readonly referral_level_id: string;

  readonly reward_distributed: boolean;

  @IsNotEmpty()
  readonly reward_amount: number;

  readonly created_by: string;

  readonly updated_by: string;
}
