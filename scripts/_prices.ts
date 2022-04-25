import {
  connectToDb,
  disconnectDb,
  removeAllFromDb,
  saveToDb,
} from "./shared/database";
import { queryModulePrices } from "./shared/queryModulePrices";
import { DbPricedItem } from "./shared/types";
import { Collection, collections } from "./_collections";

const getPricesForCollection = async (collection: Collection) => {
  console.log(`\nGetting prices for ${collection.name}`);
  console.log(`------------------\n`);
  await removeAllFromDb(collection.contractAddress);

  await Promise.allSettled([
    queryModulePrices({
      collectionAddress: collection.contractAddress,
      saveItems: async (items: DbPricedItem[]) => await saveToDb(items),
    }),
  ]);
};

const main = async () => {
  await connectToDb();

  await collections.reduce((promiseChain, collection) => {
    return promiseChain.then(() => getPricesForCollection(collection));
  }, Promise.resolve());

  await disconnectDb();
};

main();
