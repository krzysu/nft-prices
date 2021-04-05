type ItemId = string;
type Offered = number; // only ETH
type LastSale = number; // only ETH
type MinPrices = [Offered, LastSale];

export type PricesJson = Record<ItemId, MinPrices>;
