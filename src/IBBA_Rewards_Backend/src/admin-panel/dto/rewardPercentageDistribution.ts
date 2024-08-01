import { ApiProperty } from '@nestjs/swagger';

import {
  IsNotEmpty,
  IsArray,
  ArrayNotEmpty,
  ArrayMinSize,
  IsString,
  ValidateNested,
  Matches,
} from 'class-validator';

import { Type } from 'class-transformer';

export class RewardPercentageDto {
  @ApiProperty({ type: Number })
  @IsNotEmpty()
  @IsString()
  rewardLevelId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @Matches(/^(?!0\d)\d+(\.\d+)?$/, {
    message: 'rewardPercentage must contains only positive number',
  })
  rewardPercentage: string;
}

export class RewardPercentageDistributionDto {
  @ApiProperty({ type: [RewardPercentageDto] })
  @IsNotEmpty()
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => RewardPercentageDto)
  reward: RewardPercentageDto[];
}
