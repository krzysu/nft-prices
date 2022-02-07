require("dotenv").config();
import mongoose from "mongoose";
import { DbPricedItem } from "./types";

const pricedItemSchema = new mongoose.Schema({
  address: { type: String, index: true, required: true },
  tokenId: { type: String, required: true },
  marketplace: String,
  lastSale: { price: Number, symbol: String },
  offered: { price: Number, symbol: String },
});

const PricedItem = mongoose.model("PricedItem", pricedItemSchema);

export const connectToDb = async () => {
  await mongoose.connect(process.env.DATABASE_ENDPOINT!);
};

export const disconnectDb = async () => {
  await mongoose.connection.close();
};

export const saveToDb = async (items: DbPricedItem[]) => {
  await PricedItem.insertMany(items);
  // console.log(`Saved ${items.length} new items to the database`);
};

export const removeAllFromDb = async (address: string) => {
  const res = await PricedItem.deleteMany({ address });
  console.log(`Removed ${res.deletedCount} items from database for ${address}`);
};
