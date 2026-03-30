const mongoose = require("mongoose");

/** Register Account so `.populate("createdByAccountId")` / `updatedByAccountId` never throws MissingSchemaError. */
require("./account.model");

const productSchema = new mongoose.Schema(
  {
    productName: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    productCode: {
      type: String,
      uppercase: true,
      trim: true,
    },
    /** URL-friendly identifier (unique when set). */
    slug: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
      unique: true,
    },
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: [true, "Brand is required"],
    },
    /** Primary category (maps to primary_category_id). */
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price must not be negative"],
    },
    /** List / compare-at price (e.g. strikethrough on cards) — optional */
    compareAtPrice: {
      type: Number,
      default: null,
    },
    imageUrl: {
      type: String,
      default: "",
    },
    shortDescription: {
      type: String,
      default: "",
    },
    longDescription: {
      type: String,
      default: "",
    },
    stock: {
      type: Number,
      default: 0,
      min: [0, "Stock must not be negative"],
    },
    bought: {
      type: Number,
      default: 0,
      min: [0, "Bought must not be negative"],
    },
    averageRating: {
      type: Number,
      default: 0,
      min: [0, "Average rating must not be negative"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    /** Mirrors isActive for APIs that use string status; kept in sync in pre-save. */
    productStatus: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    ingredientText: {
      type: String,
      default: "",
    },
    shades: [
      {
        name: { type: String, required: true },
        hex: { type: String, required: true },
        _id: false,
      },
    ],
    skin_types_supported: {
      type: [String],
      default: [],
    },
    concerns_targeted: {
      type: [String],
      default: [],
    },
    ingredient_flags: {
      type: [String],
      default: [],
    },
    key_ingredients: {
      type: [String],
      default: [],
    },
    is_sensitive_friendly: {
      type: Boolean,
      default: false,
    },
    tone_match_supported: {
      type: [String],
      default: [],
    },
    finish_type: {
      type: String,
      default: "",
    },
    coverage_type: {
      type: String,
      default: "",
    },
    sales_count: {
      type: Number,
      default: 0,
      min: [0, "Sales count must not be negative"],
    },
    is_best_seller: {
      type: Boolean,
      default: false,
    },
    usageInstruction: {
      type: String,
      default: "",
    },
    /** Optional audit refs — must exist on schema for `.populate()` in getProductById. */
    createdByAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      default: null,
    },
    updatedByAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      default: null,
    },
  },
  { timestamps: true }
);

productSchema.index({ createdAt: -1 });
productSchema.index({ brandId: 1, createdAt: -1 });
productSchema.index({ categoryId: 1, createdAt: -1 });
/** Popular / home listing (`sort=popular`) */
productSchema.index({ bought: -1, createdAt: -1 });
/** Product code lookup (search fast path + admin) */
productSchema.index({ productCode: 1 });
productSchema.index({ skin_types_supported: 1 });
productSchema.index({ "shades.hex": 1 });

// Storefront listing hot paths (used by catalog/category/brand/price pages)
productSchema.index({ productStatus: 1, isActive: 1, categoryId: 1, price: 1 });
productSchema.index({ productStatus: 1, isActive: 1, brandId: 1, price: 1 });
productSchema.index({ productStatus: 1, isActive: 1, categoryId: 1, bought: -1 });
productSchema.index({ productStatus: 1, isActive: 1, averageRating: -1 });

function slugify(text) {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents for Vietnamese
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");
}

productSchema.pre("save", async function handleProductPreSave(next) {
  // 1. Sync productStatus and isActive
  if (this.isModified("productStatus") && !this.isModified("isActive")) {
    this.isActive = this.productStatus === "active";
  } else if (this.isModified("isActive") && !this.isModified("productStatus")) {
    this.productStatus = this.isActive ? "active" : "inactive";
  }

  // 2. Handle Slug Generation & Uniqueness
  // If slug is missing or empty, generate from productName
  if (!this.slug || String(this.slug).trim() === "") {
    this.slug = slugify(this.productName);
  } else if (this.isModified("slug")) {
    // If slug is modified (manual input), ensure it's still slugified
    this.slug = slugify(this.slug);
  }

  // Ensure slug is unique by appending suffix if necessary
  if (this.isModified("slug") || this.isNew) {
    const Product = mongoose.model("Product");
    let slugExists = await Product.findOne({
      slug: this.slug,
      _id: { $ne: this._id },
    });
    
    let count = 0;
    const baseSlug = this.slug;
    while (slugExists) {
      count++;
      this.slug = `${baseSlug}-${count}`;
      slugExists = await Product.findOne({
        slug: this.slug,
        _id: { $ne: this._id },
      });
    }
  }

  next();
});

module.exports = mongoose.model("Product", productSchema);
