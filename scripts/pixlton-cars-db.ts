import { queryLooksRare } from "./shared/queryLooksRare";
import {
  connectToDb,
  disconnectDb,
  removeAllFromDb,
  saveToDb,
} from "./shared/database";
import { queryOpenSeaAndSaveToDb } from "./shared/queryOpenSeaAndSaveToDb";
import { DbPricedItem } from "./shared/types";

const CONTRACT_ADDRESS =
  "0x584292974026978586c3007b5a15b69118130bbb".toLowerCase();
const OS_PAGES_LENGTH = 110; // 5471 / 50

const main = async () => {
  await connectToDb();
  await removeAllFromDb(CONTRACT_ADDRESS);

  await Promise.allSettled([
    queryLooksRare({
      collectionAddress: CONTRACT_ADDRESS,
      saveItems: async (items: DbPricedItem[]) => await saveToDb(items),
    }),
    queryOpenSeaAndSaveToDb({
      collectionAddress: CONTRACT_ADDRESS,
      order: "asc",
      totalPages: OS_PAGES_LENGTH,
      saveItems: async (items: DbPricedItem[]) => await saveToDb(items),
    }),
  ]);

  disconnectDb();
};

main();
