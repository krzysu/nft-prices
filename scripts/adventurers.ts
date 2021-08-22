import path from "path";
import { queryCnftio } from "./shared/queryCnftio";
import pricesDB from "../public/adventurers.json";

const DB_NAME = "../public/adventurers.json";
const filePath = path.resolve(__dirname, DB_NAME);
const policyId = "95d9a98c2f7999a3d5e0f4d795cb1333837c09eb0f24835cd2ce954c";

const main = async () => {
  await queryCnftio({
    policyId,
    searchTerm: "Grandmaster Adventurer",
    filePath,
    pricesDB,
  });
};

main();
