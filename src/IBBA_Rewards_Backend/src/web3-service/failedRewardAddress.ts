// nft-id.service.ts

import { Injectable } from '@nestjs/common';

@Injectable()
export class FailedRewardDistributionAddress {
  private _userAddresses: string[] = [];

  get userAddresses(): string[] {
    return this._userAddresses;
  }

  addUserAddress(user: string) {
    this._userAddresses.push(user);
  }
}
