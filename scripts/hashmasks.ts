import path from "path";
import { saveToFile } from "./shared/saveToFile";
import { queryOpenSea } from "./shared/queryOpenSea";

const DB_NAME = "../public/hashmasks.json";
const DB_PATH = path.resolve(__dirname, DB_NAME);
const CONTRACT_ADDRESS = "0xc2c747e0f7004f9e8817db2ca4997657a7746928";
const PAGES_LENGTH = 165;

const main = async () => {
  saveToFile({}, DB_PATH);

  await queryOpenSea({
    order: "asc",
    contractAddress: CONTRACT_ADDRESS,
    totalPages: PAGES_LENGTH,
    filePath: DB_PATH,
  });

  await queryOpenSea({
    order: "desc",
    contractAddress: CONTRACT_ADDRESS,
    totalPages: PAGES_LENGTH,
    filePath: DB_PATH,
  });
};

main();
