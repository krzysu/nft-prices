require("dotenv").config();
import mongoose from "mongoose";
import { DbItem } from "./types";

const pricedItemSchema = new mongoose.Schema({
  address: { type: String, index: true, required: true },
  tokenId: { type: String, index: true, required: true },
  marketplace: String,
  lastSale: { price: Number, symbol: String },
  offered: { price: Number, symbol: String },
});

const PricedItem = mongoose.model("PricedItem", pricedItemSchema);

export const saveToDb = async (items: DbItem[]) => {
  await mongoose.connect(process.env.DATABASE_ENDPOINT!);
  await PricedItem.insertMany(items);
  console.log(`Saved ${items.length} new items to the database`);
  mongoose.connection.close();
};

export const removeAllFromDb = async (address: string) => {
  await mongoose.connect(process.env.DATABASE_ENDPOINT!);
  const res = await PricedItem.remove({ address });
  console.log(`Removed ${res.deletedCount} items from database for ${address}`);
  mongoose.connection.close();
};

const main = async () => {
  await saveToDb([
    {
      address: "123",
      tokenId: "123",
      marketplace: "opensea",
      lastSale: undefined,
      offered: {
        price: 10,
        symbol: "ETH",
      },
    },
  ]);
};

main();
