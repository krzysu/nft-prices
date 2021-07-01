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

const buildQuery = (collection: string, cursor: string = "") => `
  {
    search(collections: [${collection}], after: "${cursor}", first: 100, toggles: [BUY_NOW]) {
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

const fetchCollectionForCursor = async (collection: string, cursor: string) => {
  const query = buildQuery(collection, cursor);

  try {
    const responseRaw = await fetch(URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.OPEN_SEA_API_KEY || "",
      },
      body: JSON.stringify({ query }),
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
  collection: string,
  cursor: string
): Promise<{
  prices: AssetWithPrices[];
  pageInfo: PageInfo;
}> => {
  try {
    const { edges, pageInfo } = await fetchCollectionForCursor(
      collection,
      cursor
    );

    const prices = edges.map((edge: any) => {
      const asset = edge.node.asset;

      if (!asset.name) {
        console.log(asset);
      }

      return {
        id: asset.name?.split("#")[1] || "",
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

type Props = {
  collection: string;
  filePath: string;
};

const singleCall = async (
  collection: string,
  filePath: string,
  cursor: string
) => {
  const { prices, pageInfo } = await getAssetsWithPrices(collection, cursor);
  const db = prepareOutputFormat(prices);

  const dbFile = fs.readFileSync(filePath, "utf8");
  const dbData = JSON.parse(dbFile);

  console.log(
    `Existing records: ${Object.keys(dbData).length}, New records ${
      Object.keys(db).length
    }`
  );

  saveToFile({ ...dbData, ...db }, filePath);

  return pageInfo;
};

export const queryOpenSeaGraph = async ({ collection, filePath }: Props) => {
  let hasNextPage = false;
  let cursor = "";
  do {
    const pageInfo = await singleCall(collection, filePath, cursor);
    cursor = pageInfo.endCursor;
    hasNextPage = pageInfo.hasNextPage;
  } while (hasNextPage);
};
