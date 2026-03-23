/**
 * Remove Customer documents that cannot be shown in admin (no name, email, or code)
 * and have no orders. Cleans related rows, then deletes the customer and its Account
 * when the account is type "customer".
 *
 * Usage: node cleanup-invalid-customers.js
 * Requires: MONGO_URI in .env
 */
require("dotenv").config();
const mongoose = require("mongoose");
const { isCustomerListable } = require("./utils/customerListable");
const Customer = require("./models/customer.model");
const Account = require("./models/account.model");
const Order = require("./models/order.model");
const Address = require("./models/address.model");
const Cart = require("./models/cart.model");
const CartItem = require("./models/cartItem.model");
const Wishlist = require("./models/wishlist.model");
const WishlistItem = require("./models/wishlistItem.model");
const CheckoutSession = require("./models/checkoutSession.model");
const LoyaltyAccount = require("./models/loyaltyAccount.model");
const LoyaltyPointLedger = require("./models/loyaltyPointLedger.model");
const CouponRedemption = require("./models/couponRedemption.model");
const Review = require("./models/review.model");
const ReviewVote = require("./models/reviewVote.model");

async function deleteRelatedToCustomer(customerId) {
  const id = customerId;
  await CheckoutSession.deleteMany({ customer_id: id });
  await Address.deleteMany({ customer_id: id });

  const carts = await Cart.find({ customer_id: id });
  for (const cart of carts) {
    await CartItem.deleteMany({ cart_id: cart._id });
    await cart.deleteOne();
  }

  const wishlists = await Wishlist.find({ customer_id: id });
  for (const w of wishlists) {
    await WishlistItem.deleteMany({ wishlistId: w._id });
    await w.deleteOne();
  }

  await LoyaltyPointLedger.deleteMany({ customer_id: id });
  await LoyaltyAccount.deleteMany({ customer_id: id });
  await CouponRedemption.deleteMany({ customer_id: id });
  await ReviewVote.deleteMany({ customer_id: id });
  await Review.deleteMany({ customer_id: id });
}

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("Missing MONGO_URI in environment.");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("Connected.\n");

  const customers = await Customer.find()
    .populate("account_id", "email phone account_type account_status")
    .sort({ created_at: -1 });

  const junk = customers.filter((c) => !isCustomerListable(c));
  console.log(`Found ${junk.length} non-listable customer document(s) (no name, email, or code).\n`);

  let removed = 0;
  let skipped = 0;

  for (const c of junk) {
    const orderCount = await Order.countDocuments({ customer_id: c._id });
    if (orderCount > 0) {
      console.log(`Skip ${c._id}: has ${orderCount} order(s) — fix data manually if needed.`);
      skipped++;
      continue;
    }

    const account_id =
      c.account_id && c.account_id._id ? c.account_id._id : c.account_id;
    await deleteRelatedToCustomer(c._id);
    await Customer.findByIdAndDelete(c._id);
    console.log(`Deleted Customer ${c._id}`);

    if (account_id) {
      const acc = await Account.findById(account_id);
      if (acc && acc.account_type === "customer") {
        await Account.findByIdAndDelete(account_id);
        console.log(`  Deleted Account ${account_id}`);
      }
    }
    removed++;
  }

  console.log(`\nDone. Removed: ${removed}, skipped (has orders): ${skipped}`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
