require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("./models/product.model");

async function cleanup() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for cleanup...");

    // Find and delete any products with empty slug
    // (Or update them to have slug: undefined)
    const emptySlugs = await Product.find({ slug: "" });
    console.log(`Found ${emptySlugs.length} products with empty slug ("")`);

    if (emptySlugs.length > 1) {
      console.log("Found more than 1 empty slug! Deleting the others might be needed, but we can just update them to undefined.");
    }

    // Update all that have slug: "" to slug: undefined
    const res = await Product.updateMany({ slug: "" }, { $unset: { slug: 1 } });
    console.log(`Updated ${res.modifiedCount} products with empty slug ("") to be undefined.`);

    // Check for productCode as well
    const emptyProductCodes = await Product.updateMany({ productCode: "" }, { $unset: { productCode: 1 } });
    console.log(`Updated ${emptyProductCodes.modifiedCount} products with empty productCode ("") to be undefined.`);

    console.log("Cleanup complete!");
  } catch (err) {
    console.error("Cleanup error:", err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

cleanup();
