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

productSchema.pre("save", function syncProductStatus(next) {
  if (this.isModified("productStatus") && !this.isModified("isActive")) {
    this.isActive = this.productStatus === "active";
  } else if (this.isModified("isActive") && !this.isModified("productStatus")) {
    this.productStatus = this.isActive ? "active" : "inactive";
  }
  next();
});

module.exports = mongoose.model("Product", productSchema);
