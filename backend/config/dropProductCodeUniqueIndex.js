const Product = require("../models/product.model");

/**
 * Drops any existing Mongo unique index on `productCode` / legacy `product_code`.
 *
 * Motivation: `productCode` used to be unique, and Mongo rejects duplicates with E11000.
 * This repo's UI request is to remove the "product code already exists" behavior.
 */
async function dropProductCodeUniqueIndex() {
  try {
    const indexes = await Product.collection.indexes();
    const targets = indexes.filter(
      (idx) =>
        idx?.unique &&
        idx?.key &&
        (idx.key.productCode === 1 || idx.key.product_code === 1)
    );

    for (const idx of targets) {
      try {
        await Product.collection.dropIndex(idx.name);
        console.log(`Dropped unique index on productCode: ${idx.name}`);
      } catch (e) {
        // Non-fatal: if we fail to drop for any reason, the old behavior may remain.
        console.warn(`Failed dropping productCode index ${idx.name}:`, e?.message ?? e);
      }
    }
  } catch (e) {
    console.warn("Failed to inspect/drop productCode unique indexes:", e?.message ?? e);
  }
}

module.exports = dropProductCodeUniqueIndex;

