import path from "path";
import { saveToFile } from "./shared/saveToFile";
import { queryLooksRare } from "./shared/queryLooksRare";

const DB_NAME = "../public/pixlton-cars-lr.json";
const DB_PATH = path.resolve(__dirname, DB_NAME);

const main = async () => {
  saveToFile({}, DB_PATH);

  await queryLooksRare({
    collectionAddress: "0x584292974026978586c3007b5a15b69118130bbb",
    filePath: DB_PATH,
  });
};

main();
