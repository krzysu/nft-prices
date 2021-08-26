import { ethers } from "ethers";
import fetch from "node-fetch";
import { saveToFile } from "./saveToFile";
import { PricesJson } from "./types";

type Response = {
  budId: string;
  lastSale: number;
  offer?: {
    amount: number;
  };
};

type Price = {
  id: string;
  sale?: number;
  offer?: number;
};

const sleep = (ms: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

const format = (value: number | undefined) => {
  if (value) {
    return Number(ethers.utils.formatUnits(value, 6));
  }
  return undefined;
};

const getMetaData = async (id: string): Promise<Price | undefined> => {
  const url = `https://spacebudz.io/api/specificSpaceBud/${id}`;

  try {
    const responseRaw = await fetch(url);
    const response = (await responseRaw.json()) as Response;

    return {
      id,
      sale: format(response.lastSale),
      offer: format(response.offer?.amount),
    };
  } catch (e) {
    console.log(e);
    return;
  }
};

const DELAY = 500;

type Props = {
  filePath: string;
};

export const querySpacebudz = async ({ filePath }: Props) => {
  const IDS = Array.from({ length: 10000 }, (_, i) => i.toString());

  const pricesOrNot = await Promise.all(
    IDS.slice(0, 100).map(async (id, index) => {
      await sleep(DELAY * index);

      console.log(`Getting assets, item id ${id}`);
      return await getMetaData(id);
    })
  );

  const prices = pricesOrNot.filter((i) => !!i) as Price[];

  const db: PricesJson = prices.reduce((acc, { id, offer, sale }) => {
    return {
      ...acc,
      [id]: [offer ? offer : 0, sale ? sale : 0], // [Offered, LastSale]
    };
  }, {} as PricesJson);

  saveToFile(db, filePath);
};
