/**
 * Backfill incomplete promotion documents (discountType, startAt, endAt).
 * Run from backend folder: node scripts/backfill-promotions.js
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const Promotion = require("../models/promotion.model");

const MONGO_URI = process.env.MONGO_URI;

async function run() {
  if (!MONGO_URI) {
    console.error("MONGO_URI is not set. Copy .env.example to .env and configure.");
    process.exit(1);
  }
  await mongoose.connect(MONGO_URI);
  const now = new Date();
  const docs = await Promotion.find({});
  let updated = 0;

  for (const p of docs) {
    const set = {};
    const dv = p.discountValue ?? 0;
    const pt = String(p.promotionType || "").toLowerCase();

    if (!p.discountType || String(p.discountType).trim() === "") {
      if (dv > 100) set.discountType = "fixed";
      else if (pt.includes("shipping") && dv === 0) set.discountType = "free_shipping";
      else set.discountType = "percentage";
    }

    if (!p.startAt) {
      set.startAt = new Date(now.getFullYear(), 0, 1);
    }

    if (p.endAt == null && (set.startAt || p.startAt)) {
      const base = set.startAt || p.startAt;
      set.endAt = new Date(new Date(base).getFullYear(), 11, 31, 23, 59, 59);
    }

    if (Object.keys(set).length) {
      await Promotion.updateOne({ _id: p._id }, { $set: set });
      updated++;
    }
  }

  console.log(`Backfill complete: ${updated} promotion(s) updated out of ${docs.length} total.`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
