import path from "path";
import { saveToFile } from "./shared/saveToFile";
import { queryOpenSeaGraph } from "./shared/queryOpenSeaGraph";

const DB_NAME = "../public/artblocks-playground.json";
const DB_PATH = path.resolve(__dirname, DB_NAME);
const COLLECTION = "art-blocks-playground";
const STRING_TRAITS = [
  {
    name: "Paper Armada",
    values: ["All Paper Armadas"],
  },
];

const main = async () => {
  saveToFile({}, DB_PATH);

  await queryOpenSeaGraph({
    vars: {
      collection: COLLECTION,
      stringTraits: STRING_TRAITS,
    },
    config: {
      getAssetId: (asset) => asset.tokenId,
    },
    filePath: DB_PATH,
  });
};

main();
