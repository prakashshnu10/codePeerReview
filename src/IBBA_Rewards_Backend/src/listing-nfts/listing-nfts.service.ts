import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import axios from 'axios';
import { Observable, delay, map } from 'rxjs';
import logger from '../helper/logger';
import { Connection } from 'typeorm';
const Web3 = require('web3');

@Injectable()
export class ListingNftsService {
  
  constructor(  private readonly dbConnection: Connection,){}

  openseaModel: any;


  // Function to retrieve NFT listings
  async retrieveListing() {

      logger.info(`retrieveListing function initiated---`);


      // Initialize a Set to store unique NFT data
      const transformedData = new Set();
      const uri = `${process.env.BASE_URI_OPENSEA}${process.env.LISTING_OPENSEA}${process.env.COLLECTION_OPENSEA}${process.env.COLLECTION_MERKLE_TREE_BY_IBBA}${process.env.TOTAL_NFTS_OPENSEA}${process.env.LIMIT_NFTS_OPENSEA}=${process.env.LIMIT_NUMBER_OPENSEA}`;
      console.log('uri',uri);
      try{
        if(process.env.OPENSEA_API_KEY == ''){
          const response = await axios.get(
            uri
          );
          let nftID;
          const listing = response.data.listings;
          const nextCurosr= response.data.next ;
          for(let i = 0;i<listing.length;i++){
            const tokenId = listing[i].protocol_data.parameters.offer[0].identifierOrCriteria;
            const price = listing[0].price.current.value;
            const currency = listing[0].price.current.currency;
            const priceInETH = Web3.utils.fromWei(price, 'ether');
            const queryToGetNFTId = 'SELECT * FROM public.get_nft($1,$2)';
            const valueToGetNFTId = [10, tokenId];
            nftID = await this.dbConnection.query(
              queryToGetNFTId,
              valueToGetNFTId,
            );
  
            const image = nftID[0].image;
            const description = nftID[0].description;
            const name = nftID[0].title;
            // Create a unique key for each item based on tokenId (assuming tokenId is unique)
            const uniqueKey = tokenId;
  
            // Check if the item with the same tokenId exists in the Set
            if (!transformedData.has(uniqueKey)) {
              transformedData.add(uniqueKey);
  
              // Store the transformed data as an object
              const transformedItem = {
                tokenId,
                name,
                description,
                image,
                priceInETH,
                currency,
              };
  
              // Add the transformed item to the Set
              transformedData.add(transformedItem);
            }
          
          }
          const transformedDataArray = Array.from(transformedData);
          // Filter the array to remove non-object elements (e.g., unique keys)
          const filteredData = transformedDataArray.filter((item) => typeof item === 'object');
          return {
            data: filteredData,
            NextPage: nextCurosr,
            // PreviousPage: previousPage,
          };
      }else{
        const response = await axios.get(
          uri,
          {
            headers: {
              'x-api-key': process.env.OPENSEA_API_KEY,
            },
          }
        );
        let nftID;
        const listing = response.data.listings;
        const nextCurosr= response.data.next ;
        for(let i = 0;i<listing.length;i++){
          const tokenId = listing[i].protocol_data.parameters.offer[0].identifierOrCriteria;
          const price = listing[0].price.current.value;
          const currency = listing[0].price.current.currency;
          const priceInETH = Web3.utils.fromWei(price, 'ether');
          const queryToGetNFTId = 'SELECT * FROM public.get_nft($1,$2)';
          const valueToGetNFTId = [10, tokenId];
          nftID = await this.dbConnection.query(
            queryToGetNFTId,
            valueToGetNFTId,
          );

          const image = nftID[0].image;
          const description = nftID[0].description;
          const name = nftID[0].title;
          // Create a unique key for each item based on tokenId (assuming tokenId is unique)
          const uniqueKey = tokenId;

          // Check if the item with the same tokenId exists in the Set
          if (!transformedData.has(uniqueKey)) {
            transformedData.add(uniqueKey);

            // Store the transformed data as an object
            const transformedItem = {
              tokenId,
              name,
              description,
              image,
              priceInETH,
              currency,
            };

            // Add the transformed item to the Set
            transformedData.add(transformedItem);
          }
        
        }
        const transformedDataArray = Array.from(transformedData);
        // Filter the array to remove non-object elements (e.g., unique keys)
        const filteredData = transformedDataArray.filter((item) => typeof item === 'object');
        return {
          data: filteredData,
          NextPage: nextCurosr,
          // PreviousPage: previousPage,
        };
      }
        
      } catch (error) {
        // Handle errors if any occur
        logger.error(error);
        throw error;
      }
  }

   // Function to retrieve NFT listings
   async retrieveListingNext(cursor) {

    logger.info(`retrieveListingNext function initiated---`);
    

     const transformedData = new Set();
     const uri = `${process.env.BASE_URI_OPENSEA}${process.env.LISTING_OPENSEA}${process.env.COLLECTION_OPENSEA}${process.env.COLLECTION_MERKLE_TREE_BY_IBBA}${process.env.TOTAL_NFTS_OPENSEA}${process.env.LIMIT_NFTS_OPENSEA}=${process.env.LIMIT_NUMBER_OPENSEA}&${process.env.CURSOR_NEXT_OPENSEA}=${cursor}`;
      
     try{
       if(process.env.OPENSEA_API_KEY == ''){
        const response = await axios.get(
          uri
        );

        let nftID;
       const listing = response.data.listings;
       const nextCurosr= response.data.next ;
       for(let i = 0;i<listing.length;i++){
         const tokenId = listing[i].protocol_data.parameters.offer[0].identifierOrCriteria;
         const price = listing[0].price.current.value;
         const currency = listing[0].price.current.currency;
         const priceInETH = Web3.utils.fromWei(price, 'ether');
         const queryToGetNFTId = 'SELECT * FROM public.get_nft($1,$2)';
         const valueToGetNFTId = [10, tokenId];
         nftID = await this.dbConnection.query(
              queryToGetNFTId,
              valueToGetNFTId,
            );

         const image = nftID[0].image;
         const description = nftID[0].description;
         const name = nftID[0].title;

         // Create a unique key for each item based on tokenId (assuming tokenId is unique)
         const uniqueKey = tokenId;

         // Check if the item with the same tokenId exists in the Set
         if (!transformedData.has(uniqueKey)) {
          transformedData.add(uniqueKey);
          // Store the transformed data as an object
          const transformedItem = {
            tokenId,
            name,
            description,
            image,
            priceInETH,
            currency,
          };

          // Add the transformed item to the Set
          transformedData.add(transformedItem);
        }
       
        }
        const transformedDataArray = Array.from(transformedData);
        // Filter the array to remove non-object elements (e.g., unique keys)
        const filteredData = transformedDataArray.filter((item) => typeof item === 'object');
        return {
         data: filteredData,
         NextPage: nextCurosr,
        };
       }
       else{
        const response = await axios.get(
          uri,
          {
            headers: {
              'x-api-key': process.env.OPENSEA_API_KEY,
            },
          }
        );
        let nftID;
       const listing = response.data.listings;
       const nextCurosr= response.data.next ;
       for(let i = 0;i<listing.length;i++){
         const tokenId = listing[i].protocol_data.parameters.offer[0].identifierOrCriteria;
         const price = listing[0].price.current.value;
         const currency = listing[0].price.current.currency;
         const priceInETH = Web3.utils.fromWei(price, 'ether');
         const queryToGetNFTId = 'SELECT * FROM public.get_nft($1,$2)';
         const valueToGetNFTId = [10, tokenId];
         nftID = await this.dbConnection.query(
              queryToGetNFTId,
              valueToGetNFTId,
            );

         const image = nftID[0].image;
         const description = nftID[0].description;
         const name = nftID[0].title;

         // Create a unique key for each item based on tokenId (assuming tokenId is unique)
         const uniqueKey = tokenId;

         // Check if the item with the same tokenId exists in the Set
         if (!transformedData.has(uniqueKey)) {
          transformedData.add(uniqueKey);
          // Store the transformed data as an object
          const transformedItem = {
            tokenId,
            name,
            description,
            image,
            priceInETH,
            currency,
          };

          // Add the transformed item to the Set
          transformedData.add(transformedItem);
        }
       
        }
        const transformedDataArray = Array.from(transformedData);
        // Filter the array to remove non-object elements (e.g., unique keys)
        const filteredData = transformedDataArray.filter((item) => typeof item === 'object');
        return {
         data: filteredData,
         NextPage: nextCurosr,
        };
       }
       
       
     }catch (error) {
      // Handle errors if any occur
      if(error.message === 'Request failed with status code 400'){
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            error: 'Cursor value is wrong!',
          },
          HttpStatus.BAD_REQUEST,
        );
      }
      logger.error(error);
      throw error;
     }
   }


   // Function to retrieve NFT listings
  async retrieveListingNewCollection() {

    logger.info(`retrieveListingNewCollection function initiated---`);

    // Initialize a Set to store unique NFT data
    const transformedData = new Set();
    const uri = `${process.env.BASE_URI_OPENSEA}${process.env.LISTING_OPENSEA}${process.env.COLLECTION_OPENSEA}${process.env.COLLECTION_MERKLETREE_BY_IBBA_NFTs}${process.env.TOTAL_NFTS_OPENSEA}${process.env.LIMIT_NFTS_OPENSEA}=${process.env.LIMIT_NUMBER_OPENSEA}`;
    console.log(uri);
    try{
      console.log("p",typeof(process.env.OPENSEA_API_KEY))
      if(process.env.OPENSEA_API_KEY === ''){
        const response = await axios.get(
          uri
        );
        let nftID;
        const listing = response.data.listings;
        const nextCurosr= response.data.next ;
        for(let i = 0;i<listing.length;i++){
          const tokenId = listing[i].protocol_data.parameters.offer[0].identifierOrCriteria;
          const price = listing[0].price.current.value;
          const currency = listing[0].price.current.currency;
          const priceInETH = Web3.utils.fromWei(price, 'ether');
          const queryToGetNFTId = 'SELECT * FROM public.get_nft($1,$2)';
          const valueToGetNFTId = [10, tokenId];
          nftID = await this.dbConnection.query(
            queryToGetNFTId,
            valueToGetNFTId,
          );
  
          const image = nftID[0].image;
          const description = nftID[0].description;
          const name = nftID[0].title;
          // Create a unique key for each item based on tokenId (assuming tokenId is unique)
          const uniqueKey = tokenId;
  
          // Check if the item with the same tokenId exists in the Set
          if (!transformedData.has(uniqueKey)) {
            transformedData.add(uniqueKey);
  
            // Store the transformed data as an object
            const transformedItem = {
              tokenId,
              name,
              description,
              image,
              priceInETH,
              currency,
            };
  
            // Add the transformed item to the Set
            transformedData.add(transformedItem);
          }
        
        }
        const transformedDataArray = Array.from(transformedData);
        // Filter the array to remove non-object elements (e.g., unique keys)
        const filteredData = transformedDataArray.filter((item) => typeof item === 'object');
        return {
          data: filteredData,
          NextPage: nextCurosr,
          // PreviousPage: previousPage,
        };
      }else{
        const response = await axios.get(
          uri,
          {
            headers: {
              'x-api-key': process.env.OPENSEA_API_KEY,
            },
          }
        );
        let nftID;
        const listing = response.data.listings;
        const nextCurosr= response.data.next ;
        for(let i = 0;i<listing.length;i++){
          const tokenId = listing[i].protocol_data.parameters.offer[0].identifierOrCriteria;
          const price = listing[0].price.current.value;
          const currency = listing[0].price.current.currency;
          const priceInETH = Web3.utils.fromWei(price, 'ether');
          const queryToGetNFTId = 'SELECT * FROM public.get_nft($1,$2)';
          const valueToGetNFTId = [10, tokenId];
          nftID = await this.dbConnection.query(
            queryToGetNFTId,
            valueToGetNFTId,
          );
  
          const image = nftID[0].image;
          const description = nftID[0].description;
          const name = nftID[0].title;
          // Create a unique key for each item based on tokenId (assuming tokenId is unique)
          const uniqueKey = tokenId;
  
          // Check if the item with the same tokenId exists in the Set
          if (!transformedData.has(uniqueKey)) {
            transformedData.add(uniqueKey);
  
            // Store the transformed data as an object
            const transformedItem = {
              tokenId,
              name,
              description,
              image,
              priceInETH,
              currency,
            };
  
            // Add the transformed item to the Set
            transformedData.add(transformedItem);
          }
        
        }
        const transformedDataArray = Array.from(transformedData);
        // Filter the array to remove non-object elements (e.g., unique keys)
        const filteredData = transformedDataArray.filter((item) => typeof item === 'object');
        return {
          data: filteredData,
          NextPage: nextCurosr,
          // PreviousPage: previousPage,
        };
      }
      
    } catch (error) {
      // Handle errors if any occur
      logger.error(error);
      throw error;
    }
}

 // Function to retrieve NFT listings
 async retrieveListingNewCollectionNext(cursor) {

  logger.info(`retrieveListingNewCollectionNext function initiated---`);

   const transformedData = new Set();
   const uri = `${process.env.BASE_URI_OPENSEA}${process.env.LISTING_OPENSEA}${process.env.COLLECTION_OPENSEA}${process.env.COLLECTION_MERKLETREE_BY_IBBA_NFTs}${process.env.TOTAL_NFTS_OPENSEA}${process.env.LIMIT_NFTS_OPENSEA}=${process.env.LIMIT_NUMBER_OPENSEA}&${process.env.CURSOR_NEXT_OPENSEA}=${cursor}`;
    
   try{
     const response = await axios.get(
       uri,
       {
         headers: {
           'x-api-key': process.env.OPENSEA_API_KEY,
         },
       }
     );
     let nftID;
     const listing = response.data.listings;
     const nextCurosr= response.data.next ;
     for(let i = 0;i<listing.length;i++){
       const tokenId = listing[i].protocol_data.parameters.offer[0].identifierOrCriteria;
       const price = listing[0].price.current.value;
       const currency = listing[0].price.current.currency;
       const priceInETH = Web3.utils.fromWei(price, 'ether');
       const queryToGetNFTId = 'SELECT * FROM public.get_nft($1,$2)';
       const valueToGetNFTId = [10, tokenId];
       nftID = await this.dbConnection.query(
            queryToGetNFTId,
            valueToGetNFTId,
          );

       const image = nftID[0].image;
       const description = nftID[0].description;
       const name = nftID[0].title;

       // Create a unique key for each item based on tokenId (assuming tokenId is unique)
       const uniqueKey = tokenId;

       // Check if the item with the same tokenId exists in the Set
       if (!transformedData.has(uniqueKey)) {
        transformedData.add(uniqueKey);
        // Store the transformed data as an object
        const transformedItem = {
          tokenId,
          name,
          description,
          image,
          priceInETH,
          currency,
        };

        // Add the transformed item to the Set
        transformedData.add(transformedItem);
      }
     
      }
      const transformedDataArray = Array.from(transformedData);
      // Filter the array to remove non-object elements (e.g., unique keys)
      const filteredData = transformedDataArray.filter((item) => typeof item === 'object');
      return {
       data: filteredData,
       NextPage: nextCurosr,
      };
   }catch (error) {
    // Handle errors if any occur
    if(error.message === 'Request failed with status code 400'){
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'Cursor value is wrong!',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    logger.error(error);
    throw error;
   }
 }


}
