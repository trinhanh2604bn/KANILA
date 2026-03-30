require("dotenv").config({ path: "./backend/.env" });
const mongoose = require("mongoose");
const Product = require("./backend/models/product.model");

async function run() {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error("MONGO_URI not found in .env");
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB successfully.");

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
      console.log(`Fixing product: "${p.productName}" (current slug: "${p.slug}")`);
      // Just calling save() will trigger the pre-save hook we added
      // which will generate a unique slug from the productName.
      p.slug = undefined; // Ensure it's treated as missing to trigger generation
      await p.save();
      console.log(`   -> New slug generated: "${p.slug}"`);
    }

    console.log("Data migration complete.");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

run();
