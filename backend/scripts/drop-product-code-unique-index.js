const connectDB = require("../config/db");
const Product = require("../models/product.model");

async function main() {
  await connectDB();

  const indexes = await Product.collection.indexes();
  const targets = indexes.filter(
    (idx) =>
      idx?.unique &&
      idx?.key &&
      (idx.key.productCode === 1 || idx.key.product_code === 1)
  );

  if (targets.length === 0) {
    console.log("No unique productCode/product_code indexes found; nothing to drop.");
    process.exit(0);
  }

  for (const idx of targets) {
    try {
      await Product.collection.dropIndex(idx.name);
      console.log(`Dropped unique index: ${idx.name}`);
    } catch (e) {
      console.error(`Failed to drop index ${idx.name}:`, e?.message ?? e);
      process.exitCode = 1;
    }
  }
}

main().catch((e) => {
  console.error("drop-product-code-unique-index failed:", e?.message ?? e);
  process.exit(1);
});

