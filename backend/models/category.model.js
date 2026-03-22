const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    categoryName: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
    },
    categoryCode: {
      type: String,
      required: [true, "Category code is required"],
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    parentCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    /** Catalog visibility (aligns with category_status in relational designs). */
    categoryStatus: {
      type: String,
      enum: ["active", "inactive", "draft"],
      default: "active",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

categorySchema.pre("save", function syncCategoryStatus(next) {
  if (this.isModified("categoryStatus") && !this.isModified("isActive")) {
    this.isActive = this.categoryStatus === "active" || this.categoryStatus === "draft";
  } else if (this.isModified("isActive") && !this.isModified("categoryStatus")) {
    this.categoryStatus = this.isActive ? "active" : "inactive";
  }
  next();
});

module.exports = mongoose.model("Category", categorySchema);
