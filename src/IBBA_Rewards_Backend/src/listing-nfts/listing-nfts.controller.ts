import { Controller, Get, HttpException, HttpStatus, Param } from '@nestjs/common';
import { ListingNftsService } from './listing-nfts.service';
import { error } from 'console';

@Controller('listing-nfts')
export class ListingNftsController {
    
  constructor(private readonly listingNftsService: ListingNftsService) {}

//* To retrieve the listed NFT
  @Get('/retrieve-listings-next/:cursor')
  async retrieveListingNext(@Param('cursor') cursor:string) {
    try{
      let result;
      if(cursor == ':cursor'){
        result = this.listingNftsService.retrieveListing();
        return result;
      }else{
        result = this.listingNftsService.retrieveListingNext(cursor);
        return result;
      }

    } catch (error){
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  //* To retrieve the listed NFT
  @Get('/retrieve-listings-new-collection-next/:cursor')
  async retrieveListingNewCollectionNext(@Param('cursor') cursor:string) {
    try{
      let result;
      if(cursor == ':cursor'){
        result = this.listingNftsService.retrieveListingNewCollection();
        return result;
      }else{
        result = this.listingNftsService.retrieveListingNewCollectionNext(cursor);
        return result;
      }

    } catch (error){
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }


 
}
