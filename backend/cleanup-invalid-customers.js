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
  await CheckoutSession.deleteMany({ customerId: id });
  await Address.deleteMany({ customerId: id });

  const carts = await Cart.find({ customerId: id });
  for (const cart of carts) {
    await CartItem.deleteMany({ cartId: cart._id });
    await cart.deleteOne();
  }

  const wishlists = await Wishlist.find({ customerId: id });
  for (const w of wishlists) {
    await WishlistItem.deleteMany({ wishlistId: w._id });
    await w.deleteOne();
  }

  await LoyaltyPointLedger.deleteMany({ customerId: id });
  await LoyaltyAccount.deleteMany({ customerId: id });
  await CouponRedemption.deleteMany({ customerId: id });
  await ReviewVote.deleteMany({ customerId: id });
  await Review.deleteMany({ customerId: id });
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
    .populate("accountId", "email phone accountType accountStatus")
    .sort({ createdAt: -1 });

  const junk = customers.filter((c) => !isCustomerListable(c));
  console.log(`Found ${junk.length} non-listable customer document(s) (no name, email, or code).\n`);

  let removed = 0;
  let skipped = 0;

  for (const c of junk) {
    const orderCount = await Order.countDocuments({ customerId: c._id });
    if (orderCount > 0) {
      console.log(`Skip ${c._id}: has ${orderCount} order(s) — fix data manually if needed.`);
      skipped++;
      continue;
    }

    const accountId = c.accountId && c.accountId._id ? c.accountId._id : c.accountId;
    await deleteRelatedToCustomer(c._id);
    await Customer.findByIdAndDelete(c._id);
    console.log(`Deleted Customer ${c._id}`);

    if (accountId) {
      const acc = await Account.findById(accountId);
      if (acc && acc.accountType === "customer") {
        await Account.findByIdAndDelete(accountId);
        console.log(`  Deleted Account ${accountId}`);
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
