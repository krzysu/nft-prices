import path from "path";
import { querySpacebudz } from "./shared/querySpacebudz";

const DB_NAME = "../public/spacebudz.json";
const filePath = path.resolve(__dirname, DB_NAME);

const main = async () => {
  await querySpacebudz({
    filePath,
  });
};

main();
