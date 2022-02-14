import "dotenv/config";
import fs from "fs";
import { ethers } from "ethers";
import { OpenSeaPort, Network } from "opensea-js";
import { AssetEvent, Order } from "opensea-js/lib/types";
import { saveToFile } from "./saveToFile";
import { PricesJson } from "./types";

const provider = new ethers.providers.JsonRpcProvider(
  `https://mainnet.infura.io`
);

const seaport = new OpenSeaPort(provider, {
  networkName: Network.Main,
  apiKey: process.env.OPEN_SEA_API_KEY,
});

type Price = {
  price: number;
  symbol: string;
};

type AssetWithPrices = {
  id: string;
  offeredFor: Price | null;
  lastSale: Price | null;
};

const sleep = (ms: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

const formatOrder = (order: Order): Price | null => {
  // not interested in auctions where reserve price not met
  if (order.waitingForBestCounterOrder) return null;

  const decimals = order.paymentTokenContract?.decimals || 18;
  const price = Number(
    Number(
      ethers.utils.formatUnits(order.currentPrice?.toString() || "0", decimals)
    ).toFixed(4)
  );

  return {
    price,
    symbol: order.paymentTokenContract?.symbol || "",
  };
};

const formatLastSale = (event: AssetEvent): Price => {
  const decimals = event.paymentToken?.decimals || 18;
  const price = Number(
    Number(
      ethers.utils.formatUnits(event.totalPrice?.toString() || "0", decimals)
    ).toFixed(4)
  );

  return {
    price,
    symbol: event.paymentToken?.symbol || "",
  };
};

const LIMIT = 50;
const DELAY = 1000;

const getAssetsForPage = async (
  page: number,
  order: string,
  contractAddress: string
): Promise<AssetWithPrices[]> => {
  try {
    const { assets } = await seaport.api.getAssets({
      asset_contract_address: contractAddress,
      limit: LIMIT,
      offset: page * LIMIT,
      order_direction: order, // asc or desc
    });

    if (assets.length === 0) {
      console.log(`No more assets`);
    }

    return assets.map((asset) => {
      const { tokenId, sellOrders, lastSale } = asset;

      return {
        id: tokenId!,
        offeredFor:
          sellOrders && sellOrders[0] ? formatOrder(sellOrders[0]) : null,
        lastSale: lastSale ? formatLastSale(lastSale) : null,
      };
    });
  } catch (e) {
    console.error(e);
    return [];
  }
};

const allowedSymbols = ["ETH", "WETH"];

type Props = {
  order: "asc" | "desc";
  contractAddress: string;
  totalPages: number;
  filePath: string;
};

export const queryOpenSea = async ({
  order,
  contractAddress,
  totalPages,
  filePath,
}: Props) => {
  const PAGES = Array.from({ length: totalPages }, (_, i) => i);

  const data = await Promise.all(
    PAGES.map(async (page, index) => {
      await sleep(DELAY * index);

      console.log(`Getting assets, page ${page}, order direction ${order}`);
      return await getAssetsForPage(page, order, contractAddress);
    })
  );

  const db: PricesJson = data
    .flat()
    .reduce((acc, { id, offeredFor, lastSale }): PricesJson => {
      if (!offeredFor && !lastSale) return acc;

      const result = [];
      result.push(
        offeredFor && allowedSymbols.includes(offeredFor.symbol)
          ? offeredFor.price
          : 0
      );

      result.push(
        lastSale && allowedSymbols.includes(lastSale.symbol)
          ? lastSale.price
          : 0
      );

      return {
        ...acc,
        [id]: result,
      };
    }, {});

  const dbFile = fs.readFileSync(filePath, "utf8");
  const dbData = JSON.parse(dbFile);

  console.log(
    `Existing records: ${Object.keys(dbData).length}, New records ${
      Object.keys(db).length
    }, from #${Object.keys(db)[0]} to #${
      Object.keys(db)[Object.keys(db).length - 1]
    }`
  );

  saveToFile({ ...dbData, ...db }, filePath);
};
