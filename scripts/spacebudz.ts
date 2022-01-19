import path from "path";
import { querySpacebudzFast } from "./shared/querySpacebudzFast";

const DB_NAME = "../public/spacebudz.json";
const filePath = path.resolve(__dirname, DB_NAME);

const main = async () => {
  await querySpacebudzFast({
    filePath,
  });
};

main();
