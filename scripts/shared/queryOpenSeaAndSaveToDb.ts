require("dotenv").config();
import { ethers } from "ethers";
import { OpenSeaPort, Network } from "opensea-js";
import { AssetEvent, OpenSeaAsset, Order } from "opensea-js/lib/types";
import { DbPrice, DbPricedItem, Marketplace } from "./types";

const provider = new ethers.providers.JsonRpcProvider(
  `https://mainnet.infura.io`
);

const seaport = new OpenSeaPort(provider, {
  networkName: Network.Main,
  apiKey: process.env.OPEN_SEA_API_KEY,
});

const sleep = (ms: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

const formatOrder = (order: Order): DbPrice | undefined => {
  // not interested in auctions where reserve price not met
  if (order.waitingForBestCounterOrder) return undefined;

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

const formatLastSale = (event: AssetEvent): DbPrice => {
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
const DELAY = 500;

const getAssetsForPage = async (
  page: number,
  order: string,
  collectionAddress: string,
  saveItems: (items: DbPricedItem[]) => Promise<void>
): Promise<void> => {
  try {
    const { assets } = await seaport.api.getAssets({
      asset_contract_address: collectionAddress,
      limit: LIMIT,
      offset: page * LIMIT,
      order_direction: order, // asc or desc
    });

    if (assets.length === 0) {
      console.log(`No more assets`);
    }

    const pricedItems: DbPricedItem[] = assets
      .map((asset: OpenSeaAsset) => {
        const { tokenId, sellOrders, lastSale } = asset;

        return {
          tokenId: tokenId!,
          address: collectionAddress,
          marketplace: Marketplace.OpenSea,
          offered:
            sellOrders && sellOrders[0]
              ? formatOrder(sellOrders[0])
              : undefined,
          lastSale: lastSale ? formatLastSale(lastSale) : undefined,
        };
      })
      .filter((item) => !!item.offered || !!item.lastSale);

    if (pricedItems.length > 0) {
      try {
        await saveItems(pricedItems);
      } catch (e) {
        console.error(e);
      }
    }
  } catch (e) {
    console.error(e);
  }
};

type Props = {
  order: "asc" | "desc";
  collectionAddress: string;
  totalPages: number;
  saveItems: (items: DbPricedItem[]) => Promise<void>;
};

export const queryOpenSeaAndSaveToDb = async ({
  order,
  collectionAddress,
  totalPages,
  saveItems,
}: Props) => {
  const PAGES = Array.from({ length: totalPages }, (_, i) => i);

  await Promise.all(
    PAGES.map(async (page, index) => {
      await sleep(DELAY * index);

      console.log(
        `OpenSea: getting assets, page ${page}, order direction ${order}`
      );
      await getAssetsForPage(page, order, collectionAddress, saveItems);
    })
  );
};
