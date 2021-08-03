import path from "path";
import scrapeIt from "scrape-it";
import numbro from "numbro";
import { saveToFile } from "./shared/saveToFile";
import { PricesJson } from "./shared/types";
import _pricesDB from "../public/punks.json";

const pricesDB = _pricesDB as Record<string, number[]>;

const DB_NAME = "../public/punks.json";
const DB_PATH = path.resolve(__dirname, DB_NAME);

type Price = {
  id: string;
  saleEth?: number;
  offerEth?: number;
};

type ScrappedSale = {
  punkId: string;
  price: string;
};

type SalesData = {
  sales: ScrappedSale[];
};

type OffersData = {
  offers: {
    title: string;
  }[];
};

const buildLastSale = (scrappedData: ScrappedSale): Price => {
  const id = scrappedData.punkId.split(" ")[1].slice(1);
  const value = scrappedData.price.split("\n")[0].replace("Ξ", "");

  return {
    id,
    saleEth: numbro.unformat(value.toLowerCase()),
  };
};

const scrapeRecentSales = async (): Promise<Price[]> => {
  try {
    const { data, response } = await scrapeIt(
      `https://www.larvalabs.com/cryptopunks/sales?perPage=1000&page=1`,
      {
        sales: {
          listItem: ".punk-image-container-dense",
          data: {
            punkId: {
              selector: "a",
              attr: "title",
            },
            price: {
              selector: ".punk-image-text-dense",
            },
          },
        },
      }
    );

    if (response.statusCode == 200) {
      return (data as SalesData).sales.map((i) => buildLastSale(i));
    } else {
      console.log(`Error ${response.statusCode}`);
    }
  } catch (e) {
    console.log(`Error ${e.message}`);
  }

  return [];
};

const buildOffer = (scrappedTitle: string): Price => {
  const parts = scrappedTitle.split(" ");
  const value = parts[4].replace(/,/gi, "");

  return {
    id: parts[1].slice(1),
    offerEth: Number(value),
  };
};

const scrapeOffers = async (): Promise<Price[]> => {
  try {
    const { data, response } = await scrapeIt(
      `https://www.larvalabs.com/cryptopunks/forsale`,
      {
        offers: {
          listItem: ".punk-image-container-dense",
          data: {
            title: {
              selector: "a",
              attr: "title",
            },
          },
        },
      }
    );

    if (response.statusCode == 200) {
      return (data as OffersData).offers.map((i) => buildOffer(i.title));
    } else {
      console.log(`Error ${response.statusCode}`);
    }
  } catch (e) {
    console.log(`Error ${e.message}`);
  }

  return [];
};

const main = async () => {
  const offers = await scrapeOffers();
  const sales = await scrapeRecentSales();

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
