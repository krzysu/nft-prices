import fetch from "node-fetch";
import path from "path";
import { ethers } from "ethers";
import { saveToFile } from "./shared/saveToFile";
import { PricesJson } from "./shared/types";
import _pricesDB from "../public/spacebudz.json";

const pricesDB = _pricesDB as Record<string, number[]>;

const DB_NAME = "../public/spacebudz.json";
const DB_PATH = path.resolve(__dirname, DB_NAME);

const sleep = (ms: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

const POLICY_ID = "d5e6bf0500378d4f0da4e8dde6becec7621cd8cbf5cbb9b87013d4cc";

type Response = {
  found: number;
  assets: {
    assetid: string; // "SpaceBud #1116",
    date: number; // 1629237705941,
    unit: string; // "d5e6bf0500378d4f0da4e8dde6becec7621cd8cbf5cbb9b87013d4cc537061636542756431313136",
    price: number; /// 870000000
  }[];
};

type Price = {
  id: string;
  saleEth?: number;
  offerEth?: number;
};

const getMetaData = async (page: number): Promise<Price[]> => {
  const search = "SpaceBud";
  const url = `https://api.cnft.io/api/sold?search=${search}&sort=date&order=desc&count=500&page=${page}`;

  try {
    const responseRaw = await fetch(url);
    const response = (await responseRaw.json()) as Response;

    return response.assets
      .map((asset) => {
        if (asset.unit.startsWith(POLICY_ID)) {
          return {
            id: asset.assetid.split("#")[1],
            offerEth: 0,
            saleEth: Number(ethers.utils.formatUnits(asset.price, 6)),
          };
        }

        return null;
      })
      .filter((i) => !!i) as Price[];
  } catch (e) {
    console.log(e);
  }

  return [];
};

const DELAY = 200;

const main = async () => {
  const responseRaw = await fetch(
    `https://api.cnft.io/api/sold?search=SpaceBud&sort=date&order=desc&count=1&page=1`
  );
  const response = (await responseRaw.json()) as Response;

  const found = response.found;
  const pageSize = 200;
  const totalPages = Math.ceil(found / pageSize);
  const PAGES = Array.from({ length: totalPages }, (_, i) => i + 1);

  console.log(PAGES);

  const saleData = await Promise.all(
    PAGES.map(async (page, index) => {
      await sleep(DELAY * index);
      console.log(`Getting page ${page}`);
      return await getMetaData(page);
    })
  );

  const sales = saleData.flat();

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
