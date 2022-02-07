import path from "path";
import { saveToFile } from "../shared/saveToFile";
import { queryOpenSeaGraph } from "../shared/queryOpenSeaGraph";

const DB_NAME = "../public/artblocks.json";
const DB_PATH = path.resolve(__dirname, DB_NAME);

const main = async () => {
  saveToFile({}, DB_PATH);

  await queryOpenSeaGraph({
    vars: {
      collections: ["art-blocks"],
      stringTraits: [{ name: "Fidenza", values: ["All Fidenzas"] }],
    },
    config: {
      getAssetId: (asset) => asset.tokenId,
    },
    filePath: DB_PATH,
  });

  await queryOpenSeaGraph({
    vars: {
      collections: ["art-blocks"],
      stringTraits: [{ name: "Unigrids", values: ["All Unigrids"] }],
    },
    config: {
      getAssetId: (asset) => asset.tokenId,
    },
    filePath: DB_PATH,
  });

  await queryOpenSeaGraph({
    vars: {
      collections: ["art-blocks-factory"],
      stringTraits: [{ name: "Gravity 12", values: ["All Gravity 12s"] }],
    },
    config: {
      getAssetId: (asset) => asset.tokenId,
    },
    filePath: DB_PATH,
  });

  await queryOpenSeaGraph({
    vars: {
      collections: ["art-blocks-playground"],
      stringTraits: [
        {
          name: "Paper Armada",
          values: ["All Paper Armadas"],
        },
      ],
    },
    config: {
      getAssetId: (asset) => asset.tokenId,
    },
    filePath: DB_PATH,
  });
};

main();
