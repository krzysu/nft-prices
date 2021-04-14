import path from "path";
import { saveToFile } from "./shared/saveToFile";
import { queryOpenSea } from "./shared/queryOpenSea";

const DB_NAME = "../public/pixls.json";
const DB_PATH = path.resolve(__dirname, DB_NAME);
const CONTRACT_ADDRESS = "0x082903f4e94c5e10A2B116a4284940a36AFAEd63";
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
