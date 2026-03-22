const mongoose = require("mongoose");

const brandSchema = new mongoose.Schema(
  {
    brandName: {
      type: String,
      required: [true, "Brand name is required"],
      trim: true,
    },
    brandCode: {
      type: String,
      required: [true, "Brand code is required"],
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    logoUrl: {
      type: String,
      default: "",
    },
    /** Catalog lifecycle (aligns with brand_status in relational designs). */
    brandStatus: {
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

brandSchema.pre("save", function syncBrandStatus(next) {
  if (this.isModified("brandStatus") && !this.isModified("isActive")) {
    this.isActive = this.brandStatus === "active" || this.brandStatus === "draft";
  } else if (this.isModified("isActive") && !this.isModified("brandStatus")) {
    this.brandStatus = this.isActive ? "active" : "inactive";
  }
  next();
});

module.exports = mongoose.model("Brand", brandSchema);
