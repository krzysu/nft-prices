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

const TIMEOUT = 60 * 1000;

const fetchFromModule = async (url: string) => {
  const responseRaw = await fetch(url, {
    timeout: TIMEOUT,
    headers: {
      "X-API-KEY": process.env.MODULE_API_KEY || "",
    },
  });
  const response = (await responseRaw.json()) as Response;
  return response;
};

export const queryOpenSeaPrices = async (props: Props) => {
  try {
    const url = `https://api.modulenft.xyz/api/v1/opensea/listings/listings?type=${props.collectionAddress}&currencySymbol=ETH`;
    const response = await fetchFromModule(url);

    if (response.error) {
      return;
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

export const queryLooksRarePrices = async (props: Props) => {
  try {
    const url = `https://api.modulenft.xyz/api/v1/looksrare/listings/listings?type=${props.collectionAddress}&currencySymbol=ETH`;
    const response = await fetchFromModule(url);

    if (response.error) {
      return;
    }

    const pricedItems = response.listings.map((listing) => {
      return {
        tokenId: listing.tokenId,
        address: props.collectionAddress,
        marketplace: Marketplace.LooksRare,
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
