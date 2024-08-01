// nft-id.service.ts

import { Injectable } from '@nestjs/common';

@Injectable()
export class SucceededRewardDistributionAddress {
  private _userAddresses: string[] = [];

  get userAddresses(): string[] {
    return this._userAddresses;
  }

  deleteAddresses(){
    this._userAddresses.splice(0, this._userAddresses.length);
  }

  addUserAddress(user: string) {
    this._userAddresses.push(user);
  }


}
