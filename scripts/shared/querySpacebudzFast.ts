import { ethers } from "ethers";
import fetch from "node-fetch";
import { saveToFile } from "./saveToFile";
import { PricesJson } from "./types";

type ResponseOffers = {
  offers: {
    budId: string;
    offer?: {
      amount: number;
    };
  }[];
};

type ResponseSales = {
  budId: string;
  lastSale: number;
}[];

type Price = {
  id: string;
  sale?: number;
  offer?: number;
};

const format = (value: number | undefined) => {
  if (value) {
    return Number(ethers.utils.formatUnits(value, 6));
  }
  return undefined;
};

const getOffers = async (): Promise<Price[]> => {
  try {
    const responseRaw = await fetch("https://spacebudz.io/api/offers");
    const response = (await responseRaw.json()) as ResponseOffers;

    return response.offers.map((offer) => ({
      id: offer.budId,
      offer: format(offer.offer?.amount),
    }));
  } catch (e) {
    console.log(e);
    return [];
  }
};

const getSales = async (): Promise<Price[]> => {
  try {
    const responseRaw = await fetch("https://spacebudz.io/api/lastSales");
    const response = (await responseRaw.json()) as ResponseSales;

    return response.map((sale) => ({
      id: sale.budId,
      sale: format(sale.lastSale),
    }));
  } catch (e) {
    console.log(e);
    return [];
  }
};

type Props = {
  filePath: string;
};

export const querySpacebudzFast = async ({ filePath }: Props) => {
  const offers = await getOffers();
  const sales = await getSales();

  console.log("Got all prices, merging");

  const map = new Map();
  [...offers, ...sales].forEach((price) => {
    map.set(price.id, { ...map.get(price.id), ...price });
  });
  const prices = Array.from(map.values());

  console.log("Preparing to save");

  const db: PricesJson = prices.reduce((acc, { id, offer, sale }) => {
    return {
      ...acc,
      [id]: [offer ? offer : 0, sale ? sale : 0], // [Offered, LastSale]
    };
  }, {} as PricesJson);

  saveToFile(db, filePath);
};
