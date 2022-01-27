type ItemId = string;
type Offered = number; // only ETH
type LastSale = number; // only ETH
type MinPrices = [Offered, LastSale];

export type PricesJson = Record<ItemId, MinPrices>;

type Price = {
  price: number;
  symbol: string;
};

type Marketplace = "opensea" | "rarible";

export type DbItem = {
  address: string;
  tokenId: string;
  marketplace: Marketplace;
  lastSale?: Price;
  offered?: Price;
};
