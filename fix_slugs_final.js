const mongoose = require("mongoose");
const path = require("path");
const Product = require("./backend/models/product.model");

async function run() {
  try {
    // Load .env for DB URI if needed, but assuming localhost for now
    await mongoose.connect("mongodb://localhost:27017/kanila");
    console.log("Connected to MongoDB: kanila");

    // 1. Find products with empty slugs or null slugs
    const products = await Product.find({ 
      $or: [
        { slug: "" },
        { slug: null },
        { slug: { $exists: false } }
      ]
    });
    
    console.log(`Found ${products.length} products needing slug fix.`);

    for (const p of products) {
      console.log(`Fixing product: ${p.productName} (current slug: "${p.slug}")`);
      // Just calling save() will trigger the pre-save hook we just added
      // which will generate a unique slug from the productName.
      p.slug = undefined; // Ensure it's treated as missing to trigger generation
      await p.save();
      console.log(`   -> New slug: ${p.slug}`);
    }

    console.log("Data migration complete.");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

run();
