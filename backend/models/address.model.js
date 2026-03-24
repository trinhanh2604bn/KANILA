const mongoose = require("mongoose");

/**
 * Logical match to target `customer_addresses` table.
 * Primary key: MongoDB `_id` (maps to address_id).
 */
const addressSchema = new mongoose.Schema(
  {
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: [true, "Customer ID is required"],
      index: true,
    },
    address_label: {
      type: String,
      default: "",
      trim: true,
    },
    recipient_name: {
      type: String,
      required: [true, "Recipient name is required"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone is required"],
      trim: true,
    },
    address_line_1: {
      type: String,
      required: [true, "Address line 1 is required"],
      trim: true,
    },
    address_line_2: {
      type: String,
      default: "",
      trim: true,
    },
    ward: {
      type: String,
      default: "",
      trim: true,
    },
    district: {
      type: String,
      default: "",
      trim: true,
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },
    country_code: {
      type: String,
      default: "VN",
      trim: true,
    },
    postal_code: {
      type: String,
      default: "",
      trim: true,
    },
    address_type: {
      type: String,
      enum: ["home", "office", "other"],
      default: "home",
      trim: true,
    },
    address_note: {
      type: String,
      default: "",
      trim: true,
    },
    is_default_shipping: {
      type: Boolean,
      default: false,
    },
    is_default_billing: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    collection: "customer_addresses",
  }
);

addressSchema.virtual("address_id").get(function () {
  return this._id;
});

addressSchema.pre("save", function (next) {
  if (!this.address_type) this.address_type = "home";
  if (this.address_note == null) this.address_note = "";
  next();
});

addressSchema.set("toJSON", { virtuals: true });
addressSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Address", addressSchema);
