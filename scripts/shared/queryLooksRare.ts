import fetch from "node-fetch";
import { ethers } from "ethers";
import { DbPrice, DbPricedItem, Marketplace } from "./types";

type LooksRareOrder = {
  price: string;
  currency: string;
};

type LooksRareToken = {
  id: string; // cursor
  tokenId: string;
  collection: { address: string };
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
    collection {
      address
    }
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
    filter: {
      collection: collectionAddress,
      withAskOnly: true,
    },
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

    if (!response.data || !response.data.tokens) {
      console.log(response);
    }

    return response.data.tokens;
  } catch (e) {
    console.log(e);
  }

  return [];
};

const formatPrice = (obj: LooksRareOrder): DbPrice => {
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

const getOfferedPrice = (asset: LooksRareToken): DbPrice | undefined => {
  if (!asset.ask) {
    return undefined;
  }

  return formatPrice(asset.ask);
};

const getLastSalePrice = (asset: LooksRareToken): DbPrice | undefined => {
  if (!asset.lastOrder) {
    return undefined;
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
  pricedItems: DbPricedItem[];
  pageInfo: PageInfo;
}> => {
  const emptyReturn = {
    pricedItems: [],
    pageInfo: {
      endCursor: "",
      hasNextPage: false,
    },
  };
  try {
    const tokens = await fetchCollectionForCursor(collectionAddress, cursor);

    if (tokens.length === 0) {
      return emptyReturn;
    }

    const pricedItems = tokens
      .map((token) => {
        return {
          tokenId: token.tokenId,
          address: collectionAddress,
          marketplace: Marketplace.LooksRare,
          offered: getOfferedPrice(token),
          lastSale: getLastSalePrice(token),
        };
      })
      .filter((item) => !!item.offered || !!item.lastSale);

    return {
      pricedItems,
      pageInfo: {
        endCursor: tokens[tokens.length - 1]?.id || "",
        hasNextPage: true,
      },
    };
  } catch (e) {
    console.error(e);
    return emptyReturn;
  }
};

const singleCall = async (props: Props, cursor: string) => {
  const { pricedItems, pageInfo } = await getAssetsWithPrices(
    props.collectionAddress,
    cursor
  );

  if (pricedItems.length > 0) {
    try {
      await props.saveItems(pricedItems);
    } catch (e) {
      console.error(e);
    }
  }

  return pageInfo;
};

const sleep = (ms: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

const DELAY = 500;

type Props = {
  collectionAddress: string;
  saveItems: (items: DbPricedItem[]) => Promise<void>;
};

export const queryLooksRare = async (props: Props) => {
  let hasNextPage = false;
  let cursor = "";
  do {
    console.log(`LooksRare: getting assets, cursor ${cursor}`);
    const pageInfo = await singleCall(props, cursor);
    cursor = pageInfo.endCursor;
    hasNextPage = pageInfo.hasNextPage;
    await sleep(DELAY);
  } while (hasNextPage);
};
