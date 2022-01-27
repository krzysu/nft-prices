type ItemId = string;
type Offered = number; // only ETH
type LastSale = number; // only ETH
type MinPrices = [Offered, LastSale];

export type PricesJson = Record<ItemId, MinPrices>;

export type DbPrice = {
  price: number;
  symbol: string;
};

export enum Marketplace {
  OpenSea = "opensea",
  LooksRare = "looksrare",
  CryptoPunks = "cryptopunks",
}

export type DbPricedItem = {
  address: string;
  tokenId: string;
  marketplace: Marketplace;
  lastSale?: DbPrice;
  offered?: DbPrice;
};
