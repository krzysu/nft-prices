import "dotenv/config";
import path from "path";
import { ethers } from "ethers";
import { providers } from "@0xsequence/multicall";
import { saveToFile } from "./shared/saveToFile";
import { PricesJson } from "./shared/types";
import abi from "./abi/CryptoPunksMarket.json";
import _pricesDB from "../public/punks.json";

const pricesDB = _pricesDB as Record<string, number[]>;

const DB_NAME = "../public/punks.json";
const DB_PATH = path.resolve(__dirname, DB_NAME);

type Price = {
  id: string;
  saleEth?: number;
  offerEth?: number;
};

const CRYPTO_PUNKS_ADDRESS = "0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb";
const NULL_ADDRESS = "0x0000000000000000000000000000000000000000";

const scrapeOffers = async (): Promise<Price[]> => {
  const provider = new providers.MulticallProvider(
    new ethers.providers.JsonRpcProvider(
      `https://mainnet.infura.io/v3/${process.env.INFURA_ID}`
    )
  );
  const contract = new ethers.Contract(CRYPTO_PUNKS_ADDRESS, abi, provider);

  const ALL_ITEM_IDS = [...Array(10000).keys()].map((i) => i.toString());
  const contractCalls = ALL_ITEM_IDS.map((i) =>
    contract.punksOfferedForSale(i)
  );
  const results = await Promise.all(contractCalls);

  const prices = results
    .map((result) => {
      const punkId = result[1];
      const offerValue = result[3];
      const onlySellTo = result[4];
      const isForSale = result[0] && onlySellTo === NULL_ADDRESS;

      if (isForSale) {
        return {
          id: punkId.toString(),
          offerEth: Number(
            Number(ethers.utils.formatUnits(offerValue, 18)).toFixed(4)
          ),
        };
      }

      return;
    })
    .filter((i) => !!i);

  return prices as Price[];
};

const main = async () => {
  const offers = await scrapeOffers();
  const sales = [] as Price[]; // no access to sales data

  // convert stored sale prices to Price object
  const storedLastSales = Object.keys(pricesDB)
    .filter((id) => pricesDB[id][1] > 0)
    .map((id) => ({
      id,
      saleEth: pricesDB[id][1],
    }));

  const map = new Map();
  // first use existing sale prices
  storedLastSales.forEach((item) => map.set(item.id, item));

  // merge with latest offers
  offers.forEach((item) => map.set(item.id, { ...map.get(item.id), ...item }));

  // merge with recent sales
  sales
    .reverse()
    .forEach((item) => map.set(item.id, { ...map.get(item.id), ...item }));

  // prepare for storage
  const mergedArr = Array.from(map.values()) as Price[];
  const db: PricesJson = mergedArr.reduce((acc, { id, offerEth, saleEth }) => {
    return {
      ...acc,
      [id]: [offerEth ? offerEth : 0, saleEth ? saleEth : 0], // [Offered, LastSale]
    };
  }, {} as PricesJson);

  saveToFile(db, DB_PATH);
};

main();
