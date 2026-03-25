/**
 * Seed script: populate existing products with random shades and skin_types_supported.
 *
 * Usage:  node scripts/seed-shades-skin.js
 *
 * - Adds 1–5 random shades (with name + hex) to each product
 * - Adds 1–3 random skin types to each product
 * - Only updates products that don't already have shade/skin data
 */
require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("../models/product.model");

const SHADE_PALETTE = [
  { name: "Đỏ Ruby", hex: "#C41E3A" },
  { name: "Đỏ Cam", hex: "#E34234" },
  { name: "Hồng Pastel", hex: "#FFB6C1" },
  { name: "Hồng Đào", hex: "#E89CA7" },
  { name: "Hồng Nude", hex: "#E8B4B8" },
  { name: "San Hô", hex: "#FF7F50" },
  { name: "Cam Đất", hex: "#CC5500" },
  { name: "Cam Neon", hex: "#FF6700" },
  { name: "Nâu Đất", hex: "#8B4513" },
  { name: "Nâu Trầm", hex: "#6B3A2A" },
  { name: "Nâu Caramel", hex: "#A0522D" },
  { name: "Nude Hồng", hex: "#E6C2BA" },
  { name: "Nude Nâu", hex: "#C9A882" },
  { name: "Nude Cam", hex: "#DDAA77" },
  { name: "Beige Tự Nhiên", hex: "#DEB887" },
  { name: "Ivory Sáng", hex: "#FFF5EE" },
  { name: "Mận Tím", hex: "#8E4585" },
  { name: "Berry", hex: "#8E3553" },
  { name: "Tím Đỏ", hex: "#7B3F61" },
  { name: "Đen Huyền", hex: "#1A1A1A" },
  { name: "Nâu Chocolate", hex: "#3C1414" },
  { name: "Đỏ Gạch", hex: "#B22222" },
  { name: "Hồng Baby", hex: "#F4C2C2" },
  { name: "Cam San Hô", hex: "#F08080" },
  { name: "Đào Nhạt", hex: "#FFDAB9" },
];

const SKIN_TYPES = ["oily", "dry", "combination", "sensitive", "normal"];

function pickRandom(arr, min, max) {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, arr.length));
}

async function main() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    console.error("Missing MONGO_URI in .env");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB");

  const products = await Product.find({}).select("_id shades skin_types_supported").lean();
  console.log(`Found ${products.length} products`);

  let updated = 0;
  for (const p of products) {
    const update = {};
    const needShades = !p.shades || p.shades.length === 0;
    const needSkin = !p.skin_types_supported || p.skin_types_supported.length === 0;

    if (needShades) {
      update.shades = pickRandom(SHADE_PALETTE, 1, 5);
    }
    if (needSkin) {
      update.skin_types_supported = pickRandom(SKIN_TYPES, 1, 3);
    }

    if (Object.keys(update).length > 0) {
      await Product.updateOne({ _id: p._id }, { $set: update });
      updated++;
    }
  }

  console.log(`Updated ${updated} products with shade/skin data`);
  await mongoose.disconnect();
  console.log("Done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
