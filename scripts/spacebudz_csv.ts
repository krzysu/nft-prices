import path from "path";
import fs from "fs";
import parse from "csv-parse/lib/sync";
import { saveToFile } from "./shared/saveToFile";
import { PricesJson } from "./shared/types";

const DB_NAME = "../public/spacebudz.json";
const DB_PATH = path.resolve(__dirname, DB_NAME);

const SOURCE_NAME = "../db/spacebudz.csv";
const SOURCE_PATH = path.resolve(__dirname, SOURCE_NAME);

type LastTx = {
  TransactionID: string;
  ID: string;
  Type: string;
  Price: string;
  Date: string;
  ModeratorUID: string;
};

const main = async () => {
  const content = fs.readFileSync(SOURCE_PATH);

  const lastTxs: LastTx[] = parse(content, {
    columns: true,
  });

  const db: PricesJson = lastTxs.reduce((acc, lastTx) => {
    return {
      ...acc,
      [lastTx.ID]: [0, Number(lastTx.Price)], // [Offered, LastSale]
    };
  }, {});

  saveToFile(db, DB_PATH);
};

main();
