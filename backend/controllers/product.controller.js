const Product = require("../models/product.model");
const ProductMedia = require("../models/productMedia.model");
const Brand = require("../models/brand.model");
const Category = require("../models/category.model");
const validateObjectId = require("../utils/validateObjectId");

/** Attach `productMedia` from MongoDB for each product (primary + sort order). */
async function attachProductMediaToProducts(products) {
  if (!products || products.length === 0) return [];
  const ids = products.map((p) => p._id);
  const mediaList = await ProductMedia.find({ productId: { $in: ids } })
    .sort({ isPrimary: -1, sortOrder: 1, createdAt: 1 })
    .lean();

  const byPid = {};
  for (const m of mediaList) {
    const pid = m.productId.toString();
    if (!byPid[pid]) byPid[pid] = [];
    byPid[pid].push(m);
  }

  return products.map((p) => {
    const doc = typeof p.toObject === "function" ? p.toObject() : { ...p };
    doc.productMedia = byPid[p._id.toString()] || [];
    return doc;
  });
}

// GET /api/products
const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .populate("brandId", "brandName brandCode")
      .populate("categoryId", "categoryName categoryCode")
      .sort({ createdAt: -1 });

    const data = await attachProductMediaToProducts(products);

    res.status(200).json({
      success: true,
      message: "Get all products successfully",
      count: data.length,
      data,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/products/:id
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    const product = await Product.findById(id)
      .populate("brandId", "brandName brandCode")
      .populate("categoryId", "categoryName categoryCode");

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const [data] = await attachProductMediaToProducts([product]);

    res.status(200).json({
      success: true,
      message: "Get product successfully",
      data,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/products
const createProduct = async (req, res) => {
  try {
    const { productName, productCode, brandId, categoryId, price, stock, bought } = req.body;

    // Required fields check
    if (!productName || !productCode || !brandId || !categoryId || price === undefined) {
      return res.status(400).json({
        success: false,
        message: "productName, productCode, brandId, categoryId, and price are required",
      });
    }

    // Numeric validations
    if (price < 0) {
      return res.status(400).json({ success: false, message: "Price must not be negative" });
    }
    if (stock !== undefined && stock < 0) {
      return res.status(400).json({ success: false, message: "Stock must not be negative" });
    }
    if (bought !== undefined && bought < 0) {
      return res.status(400).json({ success: false, message: "Bought must not be negative" });
    }

    // Validate ObjectId format
    if (!validateObjectId(brandId)) {
      return res.status(400).json({ success: false, message: "Invalid brandId" });
    }
    if (!validateObjectId(categoryId)) {
      return res.status(400).json({ success: false, message: "Invalid categoryId" });
    }

    // Reference integrity: verify brand and category exist
    const brandExists = await Brand.findById(brandId);
    if (!brandExists) {
      return res.status(404).json({ success: false, message: "Brand not found" });
    }

    const categoryExists = await Category.findById(categoryId);
    if (!categoryExists) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    const product = await Product.create(req.body);

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Product code already exists",
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/products/:id
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { brandId, categoryId, price, stock, bought } = req.body;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    // Numeric validations (only if provided)
    if (price !== undefined && price < 0) {
      return res.status(400).json({ success: false, message: "Price must not be negative" });
    }
    if (stock !== undefined && stock < 0) {
      return res.status(400).json({ success: false, message: "Stock must not be negative" });
    }
    if (bought !== undefined && bought < 0) {
      return res.status(400).json({ success: false, message: "Bought must not be negative" });
    }

    // Reference integrity checks if updating references
    if (brandId) {
      if (!validateObjectId(brandId)) {
        return res.status(400).json({ success: false, message: "Invalid brandId" });
      }
      const brandExists = await Brand.findById(brandId);
      if (!brandExists) {
        return res.status(404).json({ success: false, message: "Brand not found" });
      }
    }

    if (categoryId) {
      if (!validateObjectId(categoryId)) {
        return res.status(400).json({ success: false, message: "Invalid categoryId" });
      }
      const categoryExists = await Category.findById(categoryId);
      if (!categoryExists) {
        return res.status(404).json({ success: false, message: "Category not found" });
      }
    }

    const product = await Product.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Product code already exists",
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/products/:id
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
      data: product,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
