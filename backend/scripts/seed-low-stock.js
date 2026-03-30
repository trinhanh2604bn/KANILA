/**
 * Set a few active products to low stock (≤ 10) so the dashboard
 * Operations / low-stock section displays real data.
 *
 * Usage:
 *   node scripts/seed-low-stock.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("../models/product.model");

const LOW_STOCK_VALUES = [2, 5, 3, 8, 1, 7, 4, 6, 9, 10];

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("Missing MONGO_URI environment variable.");

  await mongoose.connect(uri);
  console.log("Connected to MongoDB.");

  // Pick up to 5 active products with stock > 10 and set them to low stock
  const products = await Product.find({ isActive: true, stock: { $gt: 10 } })
    .sort({ createdAt: -1 })
    .limit(5)
    .select("_id productName stock")
    .lean();

  if (!products.length) {
    // If all products already have stock <= 10, or none exist, try products with any stock
    const fallback = await Product.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("_id productName stock")
      .lean();

    if (!fallback.length) {
      console.log("No active products found. Cannot seed low stock.");
      await mongoose.disconnect();
      return;
    }

    // Set these to low stock
    for (let i = 0; i < fallback.length; i++) {
      const newStock = LOW_STOCK_VALUES[i % LOW_STOCK_VALUES.length];
      await Product.updateOne({ _id: fallback[i]._id }, { $set: { stock: newStock } });
      console.log(`  "${fallback[i].productName}" stock: ${fallback[i].stock} → ${newStock}`);
    }
  } else {
    for (let i = 0; i < products.length; i++) {
      const newStock = LOW_STOCK_VALUES[i % LOW_STOCK_VALUES.length];
      await Product.updateOne({ _id: products[i]._id }, { $set: { stock: newStock } });
      console.log(`  "${products[i].productName}" stock: ${products[i].stock} → ${newStock}`);
    }
  }

  // Verify
  const lowCount = await Product.countDocuments({ stock: { $lte: 10 }, isActive: true });
  const lowItems = await Product.find({ stock: { $lte: 10 }, isActive: true })
    .sort({ stock: 1 })
    .limit(5)
    .select("productName stock")
    .lean();

  console.log(`\nVerification: ${lowCount} products with low stock (≤ 10):`);
  lowItems.forEach((p) => console.log(`  - ${p.productName}: ${p.stock} units`));

  await mongoose.disconnect();
}

main()
  .then(() => {
    console.log("\nseed-low-stock completed.");
    process.exit(0);
  })
  .catch((e) => {
    console.error("seed-low-stock failed:", e);
    process.exit(1);
  });
