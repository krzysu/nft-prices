import path from "path";
import scrapeIt from "scrape-it";
import { saveToFile } from "./shared/saveToFile";
import { PricesJson } from "./shared/types";

const DB_NAME = "../public/punks.json";
const DB_PATH = path.resolve(__dirname, DB_NAME);

type Offer = {
  id: string;
  valueEth: number;
};

const buildOffer = (scrappedTitle: string): Offer => {
  const parts = scrappedTitle.split(" ");
  const value = parts[4].replace(/,/gi, "");

  return {
    id: parts[1].slice(1),
    valueEth: Number(value),
  };
};

type Data = {
  offers: {
    title: string;
  }[];
};

const scrapeData = async () => {
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
      return (data as Data).offers.map((i) => buildOffer(i.title));
    } else {
      console.log(`Error ${response.statusCode}`);
    }
  } catch (e) {
    console.log(`Error ${e.message}`);
  }
};

const main = async () => {
  const offers = await scrapeData();

  if (!offers) {
    return;
  }

  const db: PricesJson = offers.reduce((acc, { id, valueEth }) => {
    return {
      ...acc,
      [id]: [valueEth, 0], // [Offered, LastSale]
    };
  }, {});

  saveToFile(db, DB_PATH);
};

main();
