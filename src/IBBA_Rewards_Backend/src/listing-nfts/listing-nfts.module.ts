import { Module } from '@nestjs/common';
import { ListingNftsController } from './listing-nfts.controller';
import { ListingNftsService } from './listing-nfts.service';

@Module({
    controllers: [ListingNftsController],
    providers: [ListingNftsService],
})
export class ListingNftsModule {}
