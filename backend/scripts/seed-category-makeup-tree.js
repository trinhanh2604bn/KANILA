/**
 * Seed categories from admin category-tree.seed.json into MongoDB `categories` collection.
 *
 * Schema (models/category.model.js): categoryName, categoryCode (unique, uppercased),
 * parentCategoryId, displayOrder, isActive (there is no category_status field — use isActive: true).
 *
 * Run from repo root (requires MONGO_URI in backend/.env):
 *   node backend/scripts/seed-category-makeup-tree.js
 *
 * Or from backend folder:
 *   node scripts/seed-category-makeup-tree.js
 *
 * Behavior: deletes any existing documents whose categoryCode appears in this seed, then inserts
 * the full tree (so re-runs are idempotent for these codes).
 *
 * Optional env:
 *   SEED_SKIP_CLEAR=1  — do not delete first (insert only; fails on duplicate categoryCode)
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");
const Category = require("../models/category.model");

const SEED_JSON = path.join(
  __dirname,
  "..",
  "..",
  "admin",
  "src",
  "app",
  "features",
  "categories",
  "category-tree.seed.json"
);

function loadTree() {
  const raw = fs.readFileSync(SEED_JSON, "utf8");
  return JSON.parse(raw);
}

/** Pre-order DFS: parent always appears before descendants (safe for insertMany order). */
function flattenTree(nodes, parentId, inheritedCodes) {
  const docs = [];
  if (!Array.isArray(nodes)) return docs;

  nodes.forEach((node, index) => {
    const code = String(node.category_code || "")
      .trim()
      .toUpperCase();
    if (!code) {
      throw new Error(`Missing category_code for node: ${JSON.stringify(node)}`);
    }
    if (inheritedCodes.has(code)) {
      throw new Error(`Duplicate category_code in tree: ${code}`);
    }
    inheritedCodes.add(code);

    const _id = new mongoose.Types.ObjectId();
    docs.push({
      _id,
      categoryName: String(node.category_name || "").trim(),
      categoryCode: code,
      description: "",
      parentCategoryId: parentId,
      displayOrder: index + 1,
      isActive: true,
    });

    if (node.children && node.children.length) {
      const childDocs = flattenTree(node.children, _id, inheritedCodes);
      docs.push(...childDocs);
    }
  });

  return docs;
}

async function clearMatchingCodes(categoryCodes) {
  const result = await Category.deleteMany({ categoryCode: { $in: categoryCodes } });
  console.log(`Removed ${result.deletedCount} existing categor(ies) with matching categoryCode(s).`);
}

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("Missing MONGO_URI. Set it in backend/.env");
    process.exit(1);
  }

  const tree = loadTree();
  const codes = new Set();
  const allDocs = [];
  for (const root of tree) {
    allDocs.push(...flattenTree([root], null, codes));
  }

  console.log(`Prepared ${allDocs.length} category document(s).`);

  await mongoose.connect(uri);
  console.log("Connected to MongoDB.\n");

  const codesList = [...codes];

  if (process.env.SEED_SKIP_CLEAR !== "1") {
    await clearMatchingCodes(codesList);
  } else {
    console.log("SEED_SKIP_CLEAR=1 — skipping delete; insert may fail if categoryCode exists.\n");
  }

  try {
    await Category.insertMany(allDocs, { ordered: true });
    console.log(`Inserted ${allDocs.length} categories into collection "categories".`);
  } catch (err) {
    if (err.code === 11000) {
      console.error(
        "\nDuplicate key (categoryCode). Remove conflicting rows or omit SEED_SKIP_CLEAR so the script deletes matching codes first.\n"
      );
    }
    throw err;
  }

  console.log("\nSample (root):");
  const root = allDocs[0];
  console.log({
    _id: root._id.toString(),
    categoryName: root.categoryName,
    categoryCode: root.categoryCode,
    parentCategoryId: root.parentCategoryId,
    displayOrder: root.displayOrder,
    isActive: root.isActive,
  });

  await mongoose.disconnect();
  console.log("\nDone.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
