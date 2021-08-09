import path from "path";
import { saveToFile } from "./shared/saveToFile";
import { queryOpenSea } from "./shared/queryOpenSea";

const DB_NAME = "../public/corgis.json";
const DB_PATH = path.resolve(__dirname, DB_NAME);
const CONTRACT_ADDRESS = "0x51e613727fdd2e0B91b51c3E5427E9440a7957E4";
const PAGES_LENGTH = 180;

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
