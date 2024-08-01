import { Injectable } from '@nestjs/common';

@Injectable()
export class NftIdService {
  private _nftIds: number[] = [];

  private _userAddresses: string[] = [];

  get nftIds(): number[] {
    return this._nftIds;
  }

  get userAddresses(): string[] {
    return this._userAddresses;
  }

  addUserAddress(user: string) {
    this._userAddresses.push(user);
  }

  addNftId(id: number) {
    this._nftIds.push(id);
  }
  
  deleteUserAddress(){
    this._userAddresses.splice(0, this._userAddresses.length);
  }

  deletenftId(){
    this._nftIds.splice(0, this._nftIds.length);
  }
}
