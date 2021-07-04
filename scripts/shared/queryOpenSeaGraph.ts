require("dotenv").config();
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

const URL = `https://api.opensea.io/graphql/`;

const QUERY = `
query searchQuery(
  $categories: [CollectionSlug!],
  $chains: [ChainScalar!],
  $collections: [CollectionSlug!],
  $count: Int,
  $cursor: String,
  $stringTraits: [TraitInputType!],
  $toggles: [SearchToggle!]
  ) {
  search(
    after: $cursor,
    chains: $chains,
    categories: $categories,
    collections: $collections,
    first: $count,
    numericTraits: $numericTraits,
    stringTraits: $stringTraits,
    toggles: $toggles
  ) {
    edges {
      node {
        asset {
          tokenId
          name
          assetEventData {
            lastSale {
              unitPriceQuantity {
                asset {
                  symbol
                  decimals
                }
                quantity
              }
            }
          }
          orderData {
            bestAsk {
              paymentAssetQuantity {
                asset {
                  symbol
                  decimals
                }
                quantity
              }
            }
          }
        }
      }
    }
    totalCount
    pageInfo {
      endCursor
      hasNextPage
    }
  }
}
`;

const fetchCollectionForCursor = async (vars: QueryVars, cursor: string) => {
  const variables = {
    cursor,
    count: 100,
    collections: [vars.collection],
    stringTraits: vars.stringTraits || null,
    toggles: vars.toggles || null,
  };

  try {
    const responseRaw = await fetch(URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.OPEN_SEA_API_KEY || "",
      },
      body: JSON.stringify({ query: QUERY, variables }),
    });

    const response = await responseRaw.json();

    if (!response.data) {
      console.log(response);
    }

    return response.data.search;
  } catch (e) {
    console.log(e);
  }

  return [];
};

type PriceToFormat = {
  asset: {
    symbol: string;
    decimals: number;
  };
  quantity: string;
};

const formatPrice = (obj: PriceToFormat): Price => {
  const decimals = obj.asset.decimals || 18;
  const price = Number(
    Number(ethers.utils.formatUnits(obj.quantity || "0", decimals)).toFixed(4)
  );

  return {
    price,
    symbol: obj.asset.symbol || "",
  };
};

const getOfferedFor = (asset: any): Price | null => {
  if (!asset.orderData.bestAsk) {
    return null;
  }

  return formatPrice(asset.orderData.bestAsk.paymentAssetQuantity);
};

const getLastSale = (asset: any): Price | null => {
  if (!asset.assetEventData.lastSale) {
    return null;
  }

  return formatPrice(asset.assetEventData.lastSale.unitPriceQuantity);
};

type PageInfo = {
  endCursor: string;
  hasNextPage: boolean;
};

const getAssetsWithPrices = async (
  props: Props,
  cursor: string
): Promise<{
  prices: AssetWithPrices[];
  pageInfo: PageInfo;
}> => {
  try {
    const { edges, pageInfo } = await fetchCollectionForCursor(
      props.vars,
      cursor
    );

    const prices = edges.map((edge: any) => {
      const asset = edge.node.asset;

      if (!asset) {
        return {
          id: "",
          offeredFor: null,
          lastSale: null,
        };
      }

      return {
        id: props.config.getAssetId(asset),
        offeredFor: getOfferedFor(asset),
        lastSale: getLastSale(asset),
      };
    });

    return {
      prices,
      pageInfo,
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
  const { prices, pageInfo } = await getAssetsWithPrices(props, cursor);
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

type Trait = {
  name: string;
  values: string[];
};

type QueryVars = {
  collection: string;
  stringTraits?: Trait[];
  toggles?: string[];
};

type Config = {
  getAssetId: (asset: any) => string;
};

type Props = {
  vars: QueryVars;
  config: Config;
  filePath: string;
};

export const queryOpenSeaGraph = async (props: Props) => {
  let hasNextPage = false;
  let cursor = "";
  do {
    const pageInfo = await singleCall(props, cursor);
    cursor = pageInfo.endCursor;
    hasNextPage = pageInfo.hasNextPage;
  } while (hasNextPage);
};
