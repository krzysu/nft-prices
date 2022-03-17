import { queryLooksRare } from "./shared/queryLooksRare";
import {
  connectToDb,
  disconnectDb,
  removeAllFromDb,
  saveToDb,
} from "./shared/database";
import { queryOpenSeaAndSaveToDb } from "./shared/queryOpenSeaAndSaveToDb";
import { DbPricedItem } from "./shared/types";
import { Collection, collections } from "./_collections";

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
    // queryOpenSeaAndSaveToDb({
    //   collectionAddress: collection.contractAddress,
    //   order: "asc",
    //   totalPages: requiresExtraOpenSeaRound ? halfOsPagesLength : osPagesLength,
    //   saveItems: async (items: DbPricedItem[]) => await saveToDb(items),
    // }),
  ]);

  // if (requiresExtraOpenSeaRound) {
  //   await queryOpenSeaAndSaveToDb({
  //     collectionAddress: collection.contractAddress,
  //     order: "desc",
  //     totalPages: halfOsPagesLength,
  //     saveItems: async (items: DbPricedItem[]) => await saveToDb(items),
  //   });
  // }
};

const main = async () => {
  await connectToDb();

  await collections.reduce((promiseChain, collection) => {
    return promiseChain.then(() => getPricesForCollection(collection));
  }, Promise.resolve());

  await disconnectDb();
};

main();
