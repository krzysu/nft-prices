import path from "path";
import { saveToFile } from "./shared/saveToFile";
import { queryOpenSea } from "./shared/queryOpenSea";

const DB_NAME = "../public/craniums.json";
const DB_PATH = path.resolve(__dirname, DB_NAME);
const CONTRACT_ADDRESS = "0x85f740958906b317de6ed79663012859067E745B";
const PAGES_LENGTH = 108; // not more than 200

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
