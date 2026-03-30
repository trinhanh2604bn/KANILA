const mongoose = require("mongoose");
const Product = require("./backend/models/product.model");
const slugify = require("slugify"); // Assuming slugify is available or I'll use a simple regex

async function run() {
  try {
    await mongoose.connect("mongodb://localhost:27017/kanila");
    console.log("Connected to MongoDB");

    const products = await Product.find({ slug: "" });
    console.log(`Found ${products.length} products with empty slugs`);

    for (const p of products) {
      let newSlug = slugify(p.productName, { lower: true, strict: true });
      
      // Check for uniqueness
      let count = 0;
      let tempSlug = newSlug;
      while (await Product.findOne({ slug: tempSlug, _id: { $ne: p._id } })) {
        count++;
        tempSlug = `${newSlug}-${count}`;
      }
      
      p.slug = tempSlug;
      await p.save();
      console.log(`Updated product ${p.productName} with slug: ${p.slug}`);
    }

    console.log("Done");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
