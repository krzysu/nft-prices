import { queryLooksRare } from "./shared/queryLooksRare";
import {
  connectToDb,
  disconnectDb,
  removeAllFromDb,
  saveToDb,
} from "./shared/database";
import { queryOpenSeaAndSaveToDb } from "./shared/queryOpenSeaAndSaveToDb";
import { DbPricedItem } from "./shared/types";

type Collection = {
  name: string;
  contractAddress: string;
  totalSupply: number;
};

const collections: Collection[] = [
  // {
  //   name: "The Wicked Craniums",
  //   contractAddress: "0x85f740958906b317de6ed79663012859067e745b".toLowerCase(),
  //   totalSupply: 10762,
  // },
  {
    name: "Pixlton Car Club",
    contractAddress: "0x584292974026978586c3007b5a15b69118130bbb".toLowerCase(),
    totalSupply: 4006,
  },
  {
    name: "Pixls",
    contractAddress: "0x082903f4e94c5e10A2B116a4284940a36AFAEd63".toLowerCase(),
    totalSupply: 5471,
  },
  // {
  //   name: "Hashmasks",
  //   contractAddress: "0xc2c747e0f7004f9e8817db2ca4997657a7746928".toLowerCase(),
  //   totalSupply: 16384,
  // },
];

const OS_PAGE_LIMIT = 50;

const getPricesForCollection = async (collection: Collection) => {
  console.log(`\nGetting prices for ${collection.name}`);
  console.log(`------------------\n`);
  await removeAllFromDb(collection.contractAddress);

  const osPagesLength = Math.ceil(collection.totalSupply / OS_PAGE_LIMIT);
  const halfOsPagesLength = Math.ceil(osPagesLength / 2);
  const requiresExtraOpenSeaRound = osPagesLength >= 200;

  await Promise.allSettled([
    queryLooksRare({
      collectionAddress: collection.contractAddress,
      saveItems: async (items: DbPricedItem[]) => await saveToDb(items),
    }),
    queryOpenSeaAndSaveToDb({
      collectionAddress: collection.contractAddress,
      order: "asc",
      totalPages: requiresExtraOpenSeaRound ? halfOsPagesLength : osPagesLength,
      saveItems: async (items: DbPricedItem[]) => await saveToDb(items),
    }),
  ]);

  if (requiresExtraOpenSeaRound) {
    await queryOpenSeaAndSaveToDb({
      collectionAddress: collection.contractAddress,
      order: "desc",
      totalPages: halfOsPagesLength,
      saveItems: async (items: DbPricedItem[]) => await saveToDb(items),
    });
  }
};

const main = async () => {
  await connectToDb();

  await collections.reduce((promiseChain, collection) => {
    return promiseChain.then(() => getPricesForCollection(collection));
  }, Promise.resolve());

  await disconnectDb();
};

main();
