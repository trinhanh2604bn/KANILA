const Account = require("../models/account.model");
const Customer = require("../models/customer.model");
const Address = require("../models/address.model");
const CustomerPreference = require("../models/customerPreference.model");
const LoyaltyAccount = require("../models/loyaltyAccount.model");
const LoyaltyTier = require("../models/loyaltyTier.model");
const Order = require("../models/order.model");
const Wishlist = require("../models/wishlist.model");
const WishlistItem = require("../models/wishlistItem.model");
const CouponRedemption = require("../models/couponRedemption.model");
const Coupon = require("../models/coupon.model");
const AccountAuthProvider = require("../models/accountAuthProvider.model");
const validateObjectId = require("../utils/validateObjectId");
const bcrypt = require("bcryptjs");
const { pickAccountType, pickAccountStatus } = require("../utils/accountBody");
const {
  SNAPSHOT_RECOMMENDATION_TYPE,
  generateSnapshotByAccountId,
} = require("../services/recommendationSnapshot.service");

// Some legacy/migrated accounts have date fields persisted as `{}` objects.
// Mongoose will then fail `cast`/`validate` on `account.save()` during login.
const normalizeDateField = (value) => {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
};

const sanitizeAccountDatesForSave = (account) => {
  account.email_verified_at = normalizeDateField(account.email_verified_at);
  account.phone_verified_at = normalizeDateField(account.phone_verified_at);
  account.last_login_at = normalizeDateField(account.last_login_at);
  account.created_at = normalizeDateField(account.created_at);
  account.updated_at = normalizeDateField(account.updated_at);
};

const validatePassword = (password) => {
  if (!password || password.length < 6) {
    return "Password must be at least 6 characters long";
  }
  return null;
};

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) ? null : "Invalid email format";
};

const validatePhone = (phone) => {
  if (!phone) return null;
  const phoneRegex = /^[0-9\-\+\(\)\s]{10,}$/;
  return phoneRegex.test(phone) ? null : "Invalid phone format";
};

const PUBLIC_FIELDS = "-password_hash";

const generateCustomerCode = async () => {
  const base = await Customer.countDocuments();
  for (let i = 1; i < 9999; i += 1) {
    const code = `CUS${String(base + i).padStart(4, "0")}`;
    // eslint-disable-next-line no-await-in-loop
    const exists = await Customer.findOne({ customer_code: code }).select("_id").lean();
    if (!exists) return code;
  }
  return `CUS${Date.now()}`;
};

const resolveAuthAccountAndCustomer = async (req) => {
  const accountId = req.user?.account_id || req.user?.accountId;
  if (!accountId || !validateObjectId(accountId)) return { account: null, customer: null };
  const [account, existingCustomer] = await Promise.all([
    Account.findById(accountId),
    Customer.findOne({ account_id: accountId }),
  ]);
  if (!account) return { account: null, customer: null };

  if (existingCustomer) return { account, customer: existingCustomer };

  const createdCustomer = await Customer.create({
    account_id: account._id,
    customer_code: await generateCustomerCode(),
    full_name: account.username || account.email || "Customer",
    first_name: "",
    last_name: "",
    customer_status: "active",
  });
  return { account, customer: createdCustomer };
};

const countryLabel = (code) => {
  const c = String(code || "").trim().toUpperCase();
  if (c === "VN") return "Việt Nam";
  return c || "";
};

const formatAddress = (a) => {
  const line1 = [a?.address_line_1, a?.address_line_2].filter(Boolean).join(", ");
  const tail = [a?.ward, a?.district, a?.city, countryLabel(a?.country_code)].filter(Boolean);
  const parts = [line1 || a?.address_line_1, ...tail].filter(Boolean);
  return parts.join(", ");
};

const normalizeAccountAddressBody = (body, { partial = false } = {}) => {
  const g = (snake, camel, def) => {
    if (body[snake] !== undefined) return body[snake];
    if (body[camel] !== undefined) return body[camel];
    return def;
  };
  const cityRaw = g("city", "city", partial ? undefined : undefined);
  const province = g("province_or_city", "provinceOrCity", undefined);
  const city = cityRaw !== undefined ? cityRaw : province;

  const patch = {
    address_label: g("address_label", "addressLabel", partial ? undefined : ""),
    recipient_name: g("recipient_name", "recipientName", partial ? undefined : undefined),
    phone: g("phone", "phone", partial ? undefined : undefined),
    address_line_1: g("address_line_1", "addressLine1", partial ? undefined : undefined),
    address_line_2: g("address_line_2", "addressLine2", partial ? undefined : ""),
    ward: g("ward", "ward", partial ? undefined : ""),
    district: g("district", "district", partial ? undefined : ""),
    city,
    country_code: g("country_code", "countryCode", partial ? undefined : "VN"),
    postal_code: g("postal_code", "postalCode", partial ? undefined : ""),
    address_type: g("address_type", "addressType", partial ? undefined : undefined),
    address_note: g("address_note", "addressNote", partial ? undefined : ""),
    is_default_shipping: g("is_default_shipping", "isDefaultShipping", partial ? undefined : undefined),
    is_default_billing: g("is_default_billing", "isDefaultBilling", partial ? undefined : undefined),
  };

  if (partial) {
    const out = {};
    for (const [k, v] of Object.entries(patch)) {
      if (v !== undefined) out[k] = v;
    }
    return out;
  }

  return {
    address_label: patch.address_label ?? "",
    recipient_name: patch.recipient_name,
    phone: patch.phone,
    address_line_1: patch.address_line_1,
    address_line_2: patch.address_line_2 ?? "",
    ward: patch.ward ?? "",
    district: patch.district ?? "",
    city: patch.city,
    country_code: patch.country_code ?? "VN",
    postal_code: patch.postal_code ?? "",
    address_type: patch.address_type || "home",
    address_note: patch.address_note ?? "",
    is_default_shipping: !!patch.is_default_shipping,
    is_default_billing: !!patch.is_default_billing,
  };
};

const validateNewPasswordStrength = (password) => {
  if (!password || password.length < 8) {
    return "Mật khẩu mới phải có ít nhất 8 ký tự.";
  }
  if (!/[A-Za-zÀ-ỹ]/.test(password)) {
    return "Mật khẩu mới phải có ít nhất một chữ cái.";
  }
  if (!/[0-9]/.test(password)) {
    return "Mật khẩu mới phải có ít nhất một chữ số (gồm chữ và số).";
  }
  return null;
};

const parsePreferenceValue = (value) => {
  if (value == null) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  if (raw.startsWith("[") || raw.startsWith("{")) {
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }
  return raw;
};

const toArrayPreference = (value) => {
  const parsed = parsePreferenceValue(value);
  if (Array.isArray(parsed)) return parsed.map((x) => String(x || "").trim()).filter(Boolean);
  if (typeof parsed === "string") return parsed.split(",").map((x) => x.trim()).filter(Boolean);
  return [];
};

const toStringPreference = (value) => {
  const parsed = parsePreferenceValue(value);
  return typeof parsed === "string" ? parsed : "";
};

const savePreference = async (customerId, key, value) => {
  await CustomerPreference.findOneAndUpdate(
    { customer_id: customerId, preference_key: key },
    { $set: { preference_value: JSON.stringify(value), updated_at: new Date() } },
    { upsert: true, new: true }
  );
};

// GET /api/account/profile-hub
const getProfileHub = async (req, res) => {
  try {
    const { account, customer } = await resolveAuthAccountAndCustomer(req);
    if (!account || !customer) {
      return res.status(404).json({ success: false, message: "Account profile not found" });
    }

    const [
      loyalty,
      tiers,
      addresses,
      ordersAgg,
      wishlists,
      wishlistItemsAgg,
      couponsAgg,
      skinPrefs,
      providers,
    ] = await Promise.all([
      LoyaltyAccount.findOne({ customer_id: customer._id }).populate("tierId", "tierName minimumPoints"),
      LoyaltyTier.find({ tierStatus: "active" }).sort({ minimumPoints: 1 }).lean(),
      Address.find({ customer_id: customer._id }).sort({ is_default_shipping: -1, created_at: -1 }).lean(),
      Order.aggregate([
        { $match: { customer_id: customer._id } },
        {
          $group: {
            _id: null,
            orderCount: { $sum: 1 },
            processingOrderCount: {
              $sum: {
                $cond: [{ $in: ["$order_status", ["pending", "confirmed", "processing"]] }, 1, 0],
              },
            },
          },
        },
      ]),
      Wishlist.find({ customer_id: customer._id }).lean(),
      WishlistItem.aggregate([
        { $lookup: { from: "wishlists", localField: "wishlistId", foreignField: "_id", as: "w" } },
        { $unwind: "$w" },
        { $match: { "w.customer_id": customer._id } },
        { $group: { _id: null, count: { $sum: 1 } } },
      ]),
      CouponRedemption.aggregate([
        { $match: { customer_id: customer._id, redemptionStatus: { $ne: "cancelled" } } },
        {
          $lookup: {
            from: "coupons",
            localField: "couponId",
            foreignField: "_id",
            as: "coupon",
          },
        },
        { $unwind: { path: "$coupon", preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: null,
            couponCount: { $sum: 1 },
            expiringCouponCount: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $ne: ["$coupon.validTo", null] },
                      { $lte: ["$coupon.validTo", new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]),
      CustomerPreference.find({
        customer_id: customer._id,
        preference_key: {
          $in: [
            "skin_type",
            "skin_tone",
            "eye_color",
            "concerns",
            "ingredient_preferences",
            "favorite_brands",
            "skin_goals",
            "skin_sensitivity",
          ],
        },
      }).lean(),
      AccountAuthProvider.find({ account_id: account._id }).lean(),
    ]);

    const points = Number(loyalty?.pointsBalance || 0);
    const currentTierName = loyalty?.tierId?.tierName || "Member";
    const nextTier = tiers.find((t) => Number(t.minimumPoints || 0) > points) || null;
    const defaultAddress = addresses.find((a) => a.is_default_shipping) || addresses[0] || null;
    const orders = ordersAgg[0] || { orderCount: 0, processingOrderCount: 0 };
    const wishlistCount =
      wishlistItemsAgg[0]?.count != null
        ? Number(wishlistItemsAgg[0].count)
        : Number(wishlists.length || 0);
    const coupons = couponsAgg[0] || { couponCount: 0, expiringCouponCount: 0 };
    const prefMap = new Map(skinPrefs.map((p) => [p.preference_key, p.preference_value]));

    return res.status(200).json({
      success: true,
      message: "Get profile hub successfully",
      data: {
        profile: {
          customerId: String(customer._id),
          fullName: customer.full_name || "",
          email: account.email || "",
          phone: account.phone || "",
          gender: customer.gender || "",
          birthday: customer.date_of_birth || null,
          avatarUrl: customer.avatar_url || "",
        },
        loyalty: {
          tierName: currentTierName,
          pointsBalance: points,
          nextTierName: nextTier?.tierName || null,
          pointsToNextTier: nextTier ? Math.max(0, Number(nextTier.minimumPoints || 0) - points) : 0,
        },
        stats: {
          orderCount: Number(orders.orderCount || 0),
          processingOrderCount: Number(orders.processingOrderCount || 0),
          wishlistCount,
          couponCount: Number(coupons.couponCount || 0),
          expiringCouponCount: Number(coupons.expiringCouponCount || 0),
          addressCount: Number(addresses.length || 0),
        },
        defaultAddress: defaultAddress
          ? {
              addressId: String(defaultAddress._id),
              recipientName: defaultAddress.recipient_name || "",
              phone: defaultAddress.phone || "",
              fullAddress: formatAddress(defaultAddress),
              isDefault: !!defaultAddress.is_default_shipping,
            }
          : null,
        skinProfile: {
          skinType: toArrayPreference(prefMap.get("skin_type")),
          skinTone: toStringPreference(prefMap.get("skin_tone")),
          eyeColor: toStringPreference(prefMap.get("eye_color")),
          concerns: toArrayPreference(prefMap.get("concerns")),
          ingredientPreferences: toArrayPreference(prefMap.get("ingredient_preferences")),
          favoriteBrands: toArrayPreference(prefMap.get("favorite_brands")),
          goals: toArrayPreference(prefMap.get("skin_goals")),
          sensitivityLevel: toStringPreference(prefMap.get("skin_sensitivity")),
        },
        security: {
          hasPassword: !!account.password_hash,
          linkedProviders: providers.map((p) => ({
            provider: p.provider_code,
            email: p.provider_email || "",
            linkedAt: p.linked_at || p.created_at || null,
          })),
        },
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/account/profile
const patchMyProfile = async (req, res) => {
  try {
    const { account, customer } = await resolveAuthAccountAndCustomer(req);
    if (!account || !customer) return res.status(404).json({ success: false, message: "Account profile not found" });
    const updatesCustomer = {};
    const updatesAccount = {};
    if (req.body.fullName !== undefined) updatesCustomer.full_name = String(req.body.fullName || "").trim();
    if (req.body.gender !== undefined) updatesCustomer.gender = String(req.body.gender || "").trim();
    if (req.body.birthday !== undefined) updatesCustomer.date_of_birth = req.body.birthday || null;
    if (req.body.avatarUrl !== undefined) updatesCustomer.avatar_url = String(req.body.avatarUrl || "").trim();
    if (req.body.phone !== undefined) updatesAccount.phone = String(req.body.phone || "").trim();
    await Promise.all([
      Object.keys(updatesCustomer).length ? Customer.findByIdAndUpdate(customer._id, updatesCustomer, { new: true }) : null,
      Object.keys(updatesAccount).length ? Account.findByIdAndUpdate(account._id, updatesAccount, { new: true }) : null,
    ]);
    return res.status(200).json({ success: true, message: "Profile updated successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/account/skin-profile
const getMySkinProfile = async (req, res) => {
  try {
    const { customer } = await resolveAuthAccountAndCustomer(req);
    if (!customer) return res.status(404).json({ success: false, message: "Customer profile not found" });

    const prefs = await CustomerPreference.find({
      customer_id: customer._id,
      preference_key: {
        $in: [
          "skin_type",
          "skin_tone",
          "eye_color",
          "concerns",
          "ingredient_preferences",
          "favorite_brands",
        ],
      },
    }).lean();
    const prefMap = new Map(prefs.map((p) => [p.preference_key, p.preference_value]));

    return res.status(200).json({
      success: true,
      message: "Get skin profile successfully",
      data: {
        skin_type: toArrayPreference(prefMap.get("skin_type")),
        skin_tone: toStringPreference(prefMap.get("skin_tone")),
        eye_color: toStringPreference(prefMap.get("eye_color")),
        concerns: toArrayPreference(prefMap.get("concerns")),
        ingredient_preferences: toArrayPreference(prefMap.get("ingredient_preferences")),
        favorite_brands: toArrayPreference(prefMap.get("favorite_brands")),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/account/skin-profile
const patchMySkinProfile = async (req, res) => {
  try {
    const { account, customer } = await resolveAuthAccountAndCustomer(req);
    if (!customer) return res.status(404).json({ success: false, message: "Customer profile not found" });
    const skinType = req.body.skin_type ?? req.body.skinType;
    const skinTone = req.body.skin_tone ?? req.body.skinTone;
    const eyeColor = req.body.eye_color ?? req.body.eyeColor;
    const concerns = req.body.concerns;
    const ingredientPreferences = req.body.ingredient_preferences ?? req.body.ingredientPreferences;
    const favoriteBrands = req.body.favorite_brands ?? req.body.favoriteBrands;

    const tasks = [];
    if (skinType !== undefined) tasks.push(savePreference(customer._id, "skin_type", Array.isArray(skinType) ? skinType : [skinType]));
    if (skinTone !== undefined) tasks.push(savePreference(customer._id, "skin_tone", String(skinTone || "")));
    if (eyeColor !== undefined) tasks.push(savePreference(customer._id, "eye_color", String(eyeColor || "")));
    if (concerns !== undefined) tasks.push(savePreference(customer._id, "concerns", Array.isArray(concerns) ? concerns : [concerns]));
    if (ingredientPreferences !== undefined) tasks.push(savePreference(customer._id, "ingredient_preferences", Array.isArray(ingredientPreferences) ? ingredientPreferences : [ingredientPreferences]));
    if (favoriteBrands !== undefined) tasks.push(savePreference(customer._id, "favorite_brands", Array.isArray(favoriteBrands) ? favoriteBrands : [favoriteBrands]));

    await Promise.all(tasks);

    // Persist recommendation snapshot immediately after skin profile update.
    // This prevents homepage from recomputing personalized recommendations on every login/load.
    const accountId = req.user?.account_id || req.user?.accountId || account?._id;
    if (accountId) {
      // Synchronous regen keeps homepage consistent with the updated profile.
      await generateSnapshotByAccountId({
        accountId,
        recommendationType: SNAPSHOT_RECOMMENDATION_TYPE,
        limit: 20,
        ttlHours: 48,
      });
    }

    return res.status(200).json({ success: true, message: "Skin profile updated successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/account/addresses
const getMyAddresses = async (req, res) => {
  try {
    const { customer } = await resolveAuthAccountAndCustomer(req);
    if (!customer) return res.status(404).json({ success: false, message: "Customer profile not found" });
    const addresses = await Address.find({ customer_id: customer._id }).sort({ is_default_shipping: -1, created_at: -1 });
    return res.status(200).json({ success: true, message: "Get addresses successfully", data: addresses });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/account/addresses/:id/default
const patchMyDefaultAddress = async (req, res) => {
  try {
    const { customer } = await resolveAuthAccountAndCustomer(req);
    if (!customer) return res.status(404).json({ success: false, message: "Customer profile not found" });
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid address ID" });
    const target = await Address.findOne({ _id: id, customer_id: customer._id });
    if (!target) return res.status(404).json({ success: false, message: "Address not found" });
    await Address.updateMany({ customer_id: customer._id, is_default_shipping: true }, { is_default_shipping: false });
    target.is_default_shipping = true;
    await target.save();
    return res.status(200).json({
      success: true,
      message: "Default address updated successfully",
      data: {
        address: target,
        fullAddress: formatAddress(target),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/account/addresses
const postMyAddress = async (req, res) => {
  try {
    const { customer } = await resolveAuthAccountAndCustomer(req);
    if (!customer) return res.status(404).json({ success: false, message: "Customer profile not found" });

    const payload = normalizeAccountAddressBody(req.body, { partial: false });
    const { recipient_name, phone, address_line_1, city } = payload;
    if (!recipient_name || !phone || !address_line_1 || !city) {
      return res.status(400).json({
        success: false,
        message: "Họ tên người nhận, số điện thoại, địa chỉ và tỉnh/thành phố là bắt buộc.",
      });
    }

    const count = await Address.countDocuments({ customer_id: customer._id });
    let isDefault = !!payload.is_default_shipping;
    if (count === 0) isDefault = true;
    if (isDefault) {
      await Address.updateMany({ customer_id: customer._id }, { is_default_shipping: false });
    }
    const allowedTypes = ["home", "office", "other"];
    const addressType = allowedTypes.includes(payload.address_type) ? payload.address_type : "home";

    const doc = await Address.create({
      customer_id: customer._id,
      address_label: payload.address_label || "",
      recipient_name: String(recipient_name).trim(),
      phone: String(phone).trim(),
      address_line_1: String(address_line_1).trim(),
      address_line_2: String(payload.address_line_2 || "").trim(),
      ward: String(payload.ward || "").trim(),
      district: String(payload.district || "").trim(),
      city: String(city).trim(),
      country_code: (String(payload.country_code || "VN").trim().toUpperCase() || "VN").slice(0, 8),
      postal_code: String(payload.postal_code || "").trim(),
      address_type: addressType,
      address_note: String(payload.address_note || "").trim(),
      is_default_shipping: isDefault,
      is_default_billing: !!payload.is_default_billing,
    });

    return res.status(201).json({ success: true, message: "Address created successfully", data: doc });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/account/addresses/:id
const patchMyAddress = async (req, res) => {
  try {
    const { customer } = await resolveAuthAccountAndCustomer(req);
    if (!customer) return res.status(404).json({ success: false, message: "Customer profile not found" });
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid address ID" });
    const existing = await Address.findOne({ _id: id, customer_id: customer._id });
    if (!existing) return res.status(404).json({ success: false, message: "Address not found" });

    const updates = normalizeAccountAddressBody(req.body, { partial: true });
    if (updates.address_type && !["home", "office", "other"].includes(String(updates.address_type))) {
      return res.status(400).json({ success: false, message: "Loại địa chỉ không hợp lệ." });
    }
    if (updates.is_default_shipping === true) {
      await Address.updateMany(
        { customer_id: customer._id, _id: { $ne: id }, is_default_shipping: true },
        { is_default_shipping: false }
      );
    }

    if (updates.address_label !== undefined) existing.address_label = String(updates.address_label || "").trim();
    if (updates.recipient_name !== undefined) existing.recipient_name = String(updates.recipient_name || "").trim();
    if (updates.phone !== undefined) existing.phone = String(updates.phone || "").trim();
    if (updates.address_line_1 !== undefined) existing.address_line_1 = String(updates.address_line_1 || "").trim();
    if (updates.address_line_2 !== undefined) existing.address_line_2 = String(updates.address_line_2 || "").trim();
    if (updates.ward !== undefined) existing.ward = String(updates.ward || "").trim();
    if (updates.district !== undefined) existing.district = String(updates.district || "").trim();
    if (updates.city !== undefined) existing.city = String(updates.city || "").trim();
    if (updates.country_code !== undefined) {
      existing.country_code = String(updates.country_code || "VN").trim().toUpperCase().slice(0, 8) || "VN";
    }
    if (updates.postal_code !== undefined) existing.postal_code = String(updates.postal_code || "").trim();
    if (updates.address_type !== undefined) {
      const t = String(updates.address_type);
      existing.address_type = ["home", "office", "other"].includes(t) ? t : existing.address_type;
    }
    if (updates.address_note !== undefined) existing.address_note = String(updates.address_note || "").trim();
    if (updates.is_default_shipping !== undefined) existing.is_default_shipping = !!updates.is_default_shipping;
    if (updates.is_default_billing !== undefined) existing.is_default_billing = !!updates.is_default_billing;

    if (!existing.recipient_name || !existing.phone || !existing.address_line_1 || !existing.city) {
      return res.status(400).json({
        success: false,
        message: "Họ tên người nhận, số điện thoại, địa chỉ và tỉnh/thành phố là bắt buộc.",
      });
    }

    await existing.save();

    return res.status(200).json({ success: true, message: "Address updated successfully", data: existing });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/account/addresses/:id
const deleteMyAddress = async (req, res) => {
  try {
    const { customer } = await resolveAuthAccountAndCustomer(req);
    if (!customer) return res.status(404).json({ success: false, message: "Customer profile not found" });
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid address ID" });
    const existing = await Address.findOne({ _id: id, customer_id: customer._id });
    if (!existing) return res.status(404).json({ success: false, message: "Address not found" });

    const wasDefault = !!existing.is_default_shipping;
    await Address.deleteOne({ _id: id, customer_id: customer._id });

    if (wasDefault) {
      const next = await Address.findOne({ customer_id: customer._id }).sort({ updated_at: -1, created_at: -1 });
      if (next) {
        next.is_default_shipping = true;
        await next.save();
      }
    }

    return res.status(200).json({ success: true, message: "Address deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/account/change-password
const changeMyPassword = async (req, res) => {
  try {
    const { account } = await resolveAuthAccountAndCustomer(req);
    if (!account) return res.status(404).json({ success: false, message: "Không tìm thấy tài khoản." });

    const hash = account.password_hash;
    if (!hash || String(hash).length < 20) {
      return res.status(400).json({
        success: false,
        message:
          "Tài khoản chưa thiết lập mật khẩu đăng nhập. Vui lòng dùng liên kết mạng xã hội hoặc chức năng quên mật khẩu.",
      });
    }

    const currentPassword = String(req.body.currentPassword || "");
    const newPassword = String(req.body.newPassword || "");
    const confirmPassword = String(req.body.confirmPassword || "");

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập đầy đủ mật khẩu hiện tại, mật khẩu mới và xác nhận.",
      });
    }
    if (confirmPassword !== newPassword) {
      return res.status(400).json({ success: false, message: "Mật khẩu xác nhận không khớp." });
    }
    if (newPassword === currentPassword) {
      return res.status(400).json({ success: false, message: "Mật khẩu mới phải khác mật khẩu hiện tại." });
    }

    const strengthErr = validateNewPasswordStrength(newPassword);
    if (strengthErr) return res.status(400).json({ success: false, message: strengthErr });

    const ok = await bcrypt.compare(currentPassword, String(hash));
    if (!ok) {
      return res.status(400).json({ success: false, message: "Mật khẩu hiện tại không đúng." });
    }

    const salt = await bcrypt.genSalt(10);
    account.password_hash = await bcrypt.hash(newPassword, salt);
    sanitizeAccountDatesForSave(account);
    await account.save();

    return res.status(200).json({ success: true, message: "Đã cập nhật mật khẩu thành công." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/account/providers
const getMyProviders = async (req, res) => {
  try {
    const { account } = await resolveAuthAccountAndCustomer(req);
    if (!account) return res.status(404).json({ success: false, message: "Account not found" });
    const providers = await AccountAuthProvider.find({ account_id: account._id }).lean();
    return res.status(200).json({
      success: true,
      message: "Get linked providers successfully",
      data: providers.map((p) => ({
        provider: p.provider_code,
        email: p.provider_email || "",
        linkedAt: p.linked_at || p.created_at || null,
      })),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/account/security-status
const getMySecurityStatus = async (req, res) => {
  try {
    const { account } = await resolveAuthAccountAndCustomer(req);
    if (!account) return res.status(404).json({ success: false, message: "Account not found" });
    const providers = await AccountAuthProvider.find({ account_id: account._id }).lean();
    return res.status(200).json({
      success: true,
      message: "Get security status successfully",
      data: {
        hasPassword: !!account.password_hash,
        linkedProviders: providers.map((p) => ({
          provider: p.provider_code,
          email: p.provider_email || "",
          linkedAt: p.linked_at || p.created_at || null,
        })),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/account/providers/:provider
const unlinkMyProvider = async (req, res) => {
  try {
    const provider = String(req.params.provider || "").trim().toLowerCase();
    if (!provider) return res.status(400).json({ success: false, message: "Provider is required" });
    const { account } = await resolveAuthAccountAndCustomer(req);
    if (!account) return res.status(404).json({ success: false, message: "Account not found" });

    const existing = await AccountAuthProvider.findOne({ account_id: account._id, provider_code: provider });
    if (!existing) return res.status(404).json({ success: false, message: "Linked provider not found" });

    const remainingCount = await AccountAuthProvider.countDocuments({ account_id: account._id, _id: { $ne: existing._id } });
    const hasPassword = !!account.password_hash;
    if (!hasPassword && remainingCount === 0) {
      return res.status(400).json({
        success: false,
        message: "Không thể gỡ phương thức đăng nhập cuối cùng của tài khoản.",
      });
    }

    await AccountAuthProvider.deleteOne({ _id: existing._id });
    return res.status(200).json({ success: true, message: "Provider unlinked successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/accounts
const getAllAccounts = async (req, res) => {
  try {
    const accounts = await Account.find().select(PUBLIC_FIELDS).sort({ created_at: -1 });

    res.status(200).json({
      success: true,
      message: "Get all accounts successfully",
      count: accounts.length,
      data: accounts,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/accounts/:id
const getAccountById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid account ID" });
    }

    const account = await Account.findById(id).select(PUBLIC_FIELDS);

    if (!account) {
      return res.status(404).json({ success: false, message: "Account not found" });
    }

    res.status(200).json({
      success: true,
      message: "Get account successfully",
      data: account,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/accounts
const createAccount = async (req, res) => {
  try {
    const { email, password, username, phone } = req.body;
    const account_type = pickAccountType(req.body) || "customer";
    const account_status = pickAccountStatus(req.body) || "active";

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "email and password are required",
      });
    }

    const emailError = validateEmail(email);
    if (emailError) {
      return res.status(400).json({ success: false, message: emailError });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ success: false, message: passwordError });
    }

    if (phone) {
      const phoneError = validatePhone(phone);
      if (phoneError) {
        return res.status(400).json({ success: false, message: phoneError });
      }
    }

    const validAccountTypes = ["customer", "admin", "staff"];
    if (!validAccountTypes.includes(account_type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid account type. Must be one of: ${validAccountTypes.join(", ")}`,
      });
    }

    const validStatuses = ["active", "inactive", "locked"];
    if (!validStatuses.includes(account_status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid account status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const emailLower = email.toLowerCase().trim();

    const existing = await Account.findOne({ email: emailLower });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    if (username) {
      const existingUsername = await Account.findOne({ username: username.trim() });
      if (existingUsername) {
        return res.status(400).json({
          success: false,
          message: "Username already exists",
        });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const account = await Account.create({
      email: emailLower,
      password_hash,
      account_type,
      username: username ? username.trim() : "",
      phone: phone ? phone.trim() : "",
      account_status,
    });

    const result = account.toObject();
    delete result.password_hash;

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      data: result,
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists`,
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/accounts/:id
const updateAccount = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid account ID" });
    }

    delete req.body.password_hash;
    delete req.body.passwordHash;
    delete req.body.password;

    const account = await Account.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    }).select(PUBLIC_FIELDS);

    if (!account) {
      return res.status(404).json({ success: false, message: "Account not found" });
    }

    res.status(200).json({
      success: true,
      message: "Account updated successfully",
      data: account,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/accounts/:id
const deleteAccount = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid account ID" });
    }

    const account = await Account.findByIdAndDelete(id);

    if (!account) {
      return res.status(404).json({ success: false, message: "Account not found" });
    }

    const result = account.toObject();
    delete result.password_hash;

    res.status(200).json({
      success: true,
      message: "Account deleted successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/accounts/:id
const patchAccount = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid account ID" });
    }

    const allowedSnake = ["account_status", "account_type", "phone", "username"];
    const allowedCamel = ["accountStatus", "accountType", "phone", "username"];
    const updates = {};

    for (const key of allowedSnake) {
      if (req.body[key] !== undefined) {
        if (key === "account_status") {
          const validStatuses = ["active", "inactive", "locked"];
          if (!validStatuses.includes(req.body[key])) {
            return res.status(400).json({
              success: false,
              message: `Invalid account_status. Must be one of: ${validStatuses.join(", ")}`,
            });
          }
        }
        if (key === "account_type") {
          const validTypes = ["customer", "admin", "staff"];
          if (!validTypes.includes(req.body[key])) {
            return res.status(400).json({
              success: false,
              message: `Invalid account_type. Must be one of: ${validTypes.join(", ")}`,
            });
          }
        }
        if (key === "phone" && req.body[key]) {
          const phoneError = validatePhone(req.body[key]);
          if (phoneError) {
            return res.status(400).json({ success: false, message: phoneError });
          }
        }
        if (key === "username" && req.body[key]) {
          const existingUsername = await Account.findOne({
            username: req.body[key].trim(),
            _id: { $ne: id },
          });
          if (existingUsername) {
            return res.status(400).json({
              success: false,
              message: "Username already exists",
            });
          }
        }
        updates[key] = req.body[key];
      }
    }

    for (const key of allowedCamel) {
      if (req.body[key] !== undefined && updates[key.replace(/([A-Z])/g, "_$1").toLowerCase()] === undefined) {
        const snakeKey =
          key === "accountStatus"
            ? "account_status"
            : key === "accountType"
              ? "account_type"
              : key;
        if (snakeKey === "account_status") {
          const validStatuses = ["active", "inactive", "locked"];
          if (!validStatuses.includes(req.body[key])) {
            return res.status(400).json({
              success: false,
              message: `Invalid account_status. Must be one of: ${validStatuses.join(", ")}`,
            });
          }
        }
        if (snakeKey === "account_type") {
          const validTypes = ["customer", "admin", "staff"];
          if (!validTypes.includes(req.body[key])) {
            return res.status(400).json({
              success: false,
              message: `Invalid account_type. Must be one of: ${validTypes.join(", ")}`,
            });
          }
        }
        if (key === "phone" && req.body[key]) {
          const phoneError = validatePhone(req.body[key]);
          if (phoneError) {
            return res.status(400).json({ success: false, message: phoneError });
          }
        }
        if (key === "username" && req.body[key]) {
          const existingUsername = await Account.findOne({
            username: req.body[key].trim(),
            _id: { $ne: id },
          });
          if (existingUsername) {
            return res.status(400).json({
              success: false,
              message: "Username already exists",
            });
          }
        }
        updates[snakeKey] = req.body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: "No valid fields to update" });
    }

    const account = await Account.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).select(PUBLIC_FIELDS);

    if (!account) {
      return res.status(404).json({ success: false, message: "Account not found" });
    }

    res.status(200).json({
      success: true,
      message: "Account patched successfully",
      data: account,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllAccounts,
  getAccountById,
  getProfileHub,
  patchMyProfile,
  getMySkinProfile,
  patchMySkinProfile,
  getMyAddresses,
  postMyAddress,
  patchMyAddress,
  deleteMyAddress,
  patchMyDefaultAddress,
  changeMyPassword,
  getMyProviders,
  getMySecurityStatus,
  unlinkMyProvider,
  createAccount,
  updateAccount,
  patchAccount,
  deleteAccount,
};
