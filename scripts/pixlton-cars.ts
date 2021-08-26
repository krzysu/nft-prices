import path from "path";
import { saveToFile } from "./shared/saveToFile";
import { queryOpenSea } from "./shared/queryOpenSea";

const DB_NAME = "../public/pixlton-cars.json";
const DB_PATH = path.resolve(__dirname, DB_NAME);
const CONTRACT_ADDRESS = "0x584292974026978586c3007b5a15b69118130bbb";
const PAGES_LENGTH = 110; // 5470 / 50

const main = async () => {
  saveToFile({}, DB_PATH);

  await queryOpenSea({
    order: "asc",
    contractAddress: CONTRACT_ADDRESS,
    totalPages: PAGES_LENGTH,
    filePath: DB_PATH,
  });
};

main();
