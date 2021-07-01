import path from "path";
import { saveToFile } from "./shared/saveToFile";
import { queryOpenSeaGraph } from "./shared/queryOpenSeaGraph";

const DB_NAME = "../public/ethlings.json";
const DB_PATH = path.resolve(__dirname, DB_NAME);
const COLLECTION = "ethlings";

const main = async () => {
  saveToFile({}, DB_PATH);

  await queryOpenSeaGraph({
    collection: COLLECTION,
    filePath: DB_PATH,
  });
};

main();
