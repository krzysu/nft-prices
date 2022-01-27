import fetch from "node-fetch";
import fs from "fs";
import { ethers } from "ethers";
import { saveToFile } from "./saveToFile";
import { PricesJson } from "./types";

type Price = {
  price: number;
  symbol: string;
};

type AssetWithPrices = {
  id: string;
  offeredFor: Price | null;
  lastSale: Price | null;
};

type LooksRareOrder = {
  price: string;
  currency: string; // "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
};

type LooksRareToken = {
  id: string; // cursor
  tokenId: string;
  lastOrder: LooksRareOrder;
  ask: LooksRareOrder;
  bids: LooksRareOrder[];
};

const URL = `https://api.looksrare.org/graphql`;

const QUERY = `
query GetTokens(
  $filter: TokenFilterInput
  $pagination: PaginationInput
  $sort: TokenSortInput
) {
  tokens(filter: $filter, pagination: $pagination, sort: $sort) {
    id
    tokenId
    lastOrder {
      price
      currency
    }
    ask {
      ...OrderFragment
    }
    bids(pagination: { first: 1 }) {
      ...OrderFragment
    }
  }
}

fragment OrderFragment on Order {
  price
  amount
  strategy
  currency
}`;

const fetchCollectionForCursor = async (
  collectionAddress: string,
  cursor: string
): Promise<LooksRareToken[]> => {
  const variables = {
    filter: { collection: collectionAddress, withAskOnly: true },
    pagination: { first: 25, cursor },
    sort: "PRICE_ASC",
  };

  try {
    const responseRaw = await fetch(URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: QUERY, variables }),
    });

    const response = await responseRaw.json();

    return response.data.tokens;
  } catch (e) {
    console.log(e);
  }

  return [];
};

const formatPrice = (obj: LooksRareOrder): Price => {
  const decimals = 18;
  const price = Number(
    Number(ethers.utils.formatUnits(obj.price || "0", decimals)).toFixed(4)
  );

  return {
    price,
    symbol:
      obj.currency === "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
        ? "WETH"
        : "",
  };
};

const getOfferedFor = (asset: LooksRareToken): Price | null => {
  if (!asset.ask) {
    return null;
  }

  return formatPrice(asset.ask);
};

const getLastSale = (asset: LooksRareToken): Price | null => {
  if (!asset.lastOrder) {
    return null;
  }

  return formatPrice(asset.lastOrder);
};

type PageInfo = {
  endCursor: string;
  hasNextPage: boolean;
};

const getAssetsWithPrices = async (
  collectionAddress: string,
  cursor: string
): Promise<{
  prices: AssetWithPrices[];
  pageInfo: PageInfo;
}> => {
  try {
    const tokens = await fetchCollectionForCursor(collectionAddress, cursor);

    if (tokens.length === 0) {
      return {
        prices: [],
        pageInfo: {
          endCursor: "",
          hasNextPage: false,
        },
      };
    }

    const prices = tokens.map((token) => {
      return {
        id: token.tokenId,
        offeredFor: getOfferedFor(token),
        lastSale: getLastSale(token),
      };
    });

    return {
      prices,
      pageInfo: {
        endCursor: tokens[tokens.length - 1]?.id || "",
        hasNextPage: true,
      },
    };
  } catch (e) {
    console.error(e);
    return {
      prices: [],
      pageInfo: {
        endCursor: "",
        hasNextPage: false,
      },
    };
  }
};

const allowedSymbols = ["ETH", "WETH"];

const prepareOutputFormat = (data: AssetWithPrices[]): PricesJson => {
  return data.reduce((acc, { id, offeredFor, lastSale }): PricesJson => {
    if (!offeredFor && !lastSale) return acc;

    const result = [];
    result.push(
      offeredFor && allowedSymbols.includes(offeredFor.symbol)
        ? offeredFor.price
        : 0
    );

    result.push(
      lastSale && allowedSymbols.includes(lastSale.symbol) ? lastSale.price : 0
    );

    return {
      ...acc,
      [id]: result,
    };
  }, {});
};

const singleCall = async (props: Props, cursor: string) => {
  const { prices, pageInfo } = await getAssetsWithPrices(
    props.collectionAddress,
    cursor
  );
  const db = prepareOutputFormat(prices);

  const dbFile = fs.readFileSync(props.filePath, "utf8");
  const dbData = JSON.parse(dbFile);

  console.log(
    `Existing records: ${Object.keys(dbData).length}, New records ${
      Object.keys(db).length
    }`
  );

  saveToFile({ ...dbData, ...db }, props.filePath);

  return pageInfo;
};

const sleep = (ms: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

const DELAY = 300;

type Props = {
  collectionAddress: string;
  filePath: string;
};

export const queryLooksRare = async (props: Props) => {
  let hasNextPage = false;
  let cursor = "";
  do {
    const pageInfo = await singleCall(props, cursor);
    cursor = pageInfo.endCursor;
    hasNextPage = pageInfo.hasNextPage;
    await sleep(DELAY);
  } while (hasNextPage);
};
