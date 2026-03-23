/**
 * Seed beauty brands into MongoDB `brands` collection.
 *
 * Schema (models/brand.model.js): brandName, brandCode (unique, stored UPPERCASE),
 * description, logoUrl, isActive. Timestamps: createdAt, updatedAt (Mongoose camelCase).
 * There is no brand_status field — use isActive: true for active brands.
 *
 * brand_code generation: lowercase slug from name (accents removed, spaces → _),
 * then stored as uppercase to match schema. Uniqueness enforced; collisions get _2, _3, …
 *
 * Run from backend folder:
 *   node scripts/seed-brands.js
 *
 * Requires MONGO_URI in backend/.env
 *
 * Optional:
 *   SEED_SKIP_CLEAR=1 — do not delete existing rows with matching brandCode before insert
 */

require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const Brand = require("../models/brand.model");

const BRAND_NAMES = [
  "Ami Colé",
  "Armani Beauty",
  "ABH",
  "Artist Couture",
  "Basma",
  "Beautyblender",
  "Bobbi Brown",
  "Charlotte Tilbury",
  "Clarins",
  "Clinique",
  "Dior",
  "Fenty Beauty",
  "Freck Beauty",
  "Givenchy",
  "Glossier",
  "Grande Cosmetics",
  "Gucci",
  "Guerlain",
  "Haus Labs",
  "Hourglass",
  "IT Cosmetics",
  "Kosas",
  "Kulfi",
  "Lancôme",
  "Make Up For Ever",
  "Makeup By Mario",
  "Melt Cosmetics",
  "Merit",
  "Milk Makeup",
  "Nars",
  "Natasha Denona",
  "Pat McGrath Labs",
  "Patrick Ta",
  "Shiseido",
  "Shu Uemura",
  "Sulwhasoo",
  "Tarte",
  "Too Faced",
  "Tower 28 Beauty",
  "Yves Saint Laurent",
];

/** Lowercase slug: remove accents, spaces → _, strip invalid chars */
function slugify(name) {
  const s = String(name)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
  return s || "brand";
}

/** Assign unique slugs; Mongoose brandCode is uppercase in schema */
function assignUniqueCodes(names) {
  const used = new Map();
  const rows = [];

  for (const brandName of names) {
    let base = slugify(brandName);
    let candidate = base;
    let n = 2;
    while (used.has(candidate)) {
      candidate = `${base}_${n}`;
      n += 1;
    }
    used.set(candidate, true);
    rows.push({
      brandName: brandName.trim(),
      brandCode: candidate.toUpperCase(),
      description: "",
      logoUrl: "",
      isActive: true,
    });
  }

  return rows;
}

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("Missing MONGO_URI. Set it in backend/.env");
    process.exit(1);
  }

  const rows = assignUniqueCodes(BRAND_NAMES);
  const docs = rows.map((r) => ({
    _id: new mongoose.Types.ObjectId(),
    ...r,
  }));

  const codes = docs.map((d) => d.brandCode);

  await mongoose.connect(uri);
  console.log("Connected to MongoDB.\n");

  if (process.env.SEED_SKIP_CLEAR !== "1") {
    const del = await Brand.deleteMany({ brandCode: { $in: codes } });
    console.log(`Removed ${del.deletedCount} existing brand(s) with matching brandCode(s).\n`);
  } else {
    console.log("SEED_SKIP_CLEAR=1 — skipping delete.\n");
  }

  await Brand.insertMany(docs, { ordered: true });
  console.log(`Inserted ${docs.length} brands into collection "brands".`);
  console.log("(createdAt / updatedAt set automatically by Mongoose timestamps.)\n");

  const first = await Brand.findById(docs[0]._id).lean();
  console.log("Sample:", {
    _id: first._id.toString(),
    brandName: first.brandName,
    brandCode: first.brandCode,
    isActive: first.isActive,
    createdAt: first.createdAt,
    updatedAt: first.updatedAt,
  });

  await mongoose.disconnect();
  console.log("\nDone.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
