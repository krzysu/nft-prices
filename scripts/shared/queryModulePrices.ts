import fetch from "node-fetch";
import { DbPricedItem, Marketplace } from "./types";

type Listing = {
  tokenId: string;
  price: string;
  image_url: string;
  permalink: string;
  eventTimestamp: string;
};

type Response = {
  error: any;
  collection: string;
  count: number;
  listings: Listing[];
};

type Props = {
  collectionAddress: string;
  saveItems: (items: DbPricedItem[]) => Promise<void>;
};

export const queryModulePrices = async (props: Props) => {
  try {
    const url = `https://api.modulenft.xyz/api/v1/opensea/listings/listings?type=${props.collectionAddress}&currencySymbol=ETH`;
    const responseRaw = await fetch(url);
    const response = (await responseRaw.json()) as Response;

    if (response.error) {
      return [];
    }

    const pricedItems = response.listings.map((listing) => {
      return {
        tokenId: listing.tokenId,
        address: props.collectionAddress,
        marketplace: Marketplace.OpenSea,
        offered: {
          price: Number(listing.price),
          symbol: "ETH",
        },
      };
    });

    if (pricedItems.length > 0) {
      try {
        await props.saveItems(pricedItems);
      } catch (e) {
        console.error(e);
      }
    }
  } catch (e) {
    console.error(e);
  }
};
