const PriceBook = require("../models/priceBook.model");
const validateObjectId = require("../utils/validateObjectId");

// GET /api/price-books
const getAllPriceBooks = async (req, res) => {
  try {
    const priceBooks = await PriceBook.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Get all price books successfully",
      count: priceBooks.length,
      data: priceBooks,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/price-books/:id
const getPriceBookById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid price book ID" });
    }

    const priceBook = await PriceBook.findById(id);

    if (!priceBook) {
      return res.status(404).json({ success: false, message: "Price book not found" });
    }

    res.status(200).json({
      success: true,
      message: "Get price book successfully",
      data: priceBook,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/price-books
const createPriceBook = async (req, res) => {
  try {
    const { priceBookCode, priceBookName, isDefault } = req.body;

    if (!priceBookCode || !priceBookName) {
      return res.status(400).json({
        success: false,
        message: "priceBookCode and priceBookName are required",
      });
    }

    // If isDefault, unset all others
    if (isDefault === true) {
      await PriceBook.updateMany({ isDefault: true }, { isDefault: false });
    }

    const priceBook = await PriceBook.create(req.body);

    res.status(201).json({
      success: true,
      message: "Price book created successfully",
      data: priceBook,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Price book code already exists",
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/price-books/:id
const updatePriceBook = async (req, res) => {
  try {
    const { id } = req.params;
    const { isDefault } = req.body;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid price book ID" });
    }

    // If setting as default, unset all others
    if (isDefault === true) {
      await PriceBook.updateMany({ _id: { $ne: id }, isDefault: true }, { isDefault: false });
    }

    const priceBook = await PriceBook.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!priceBook) {
      return res.status(404).json({ success: false, message: "Price book not found" });
    }

    res.status(200).json({
      success: true,
      message: "Price book updated successfully",
      data: priceBook,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Price book code already exists",
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/price-books/:id
const deletePriceBook = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid price book ID" });
    }

    const priceBook = await PriceBook.findByIdAndDelete(id);

    if (!priceBook) {
      return res.status(404).json({ success: false, message: "Price book not found" });
    }

    res.status(200).json({
      success: true,
      message: "Price book deleted successfully",
      data: priceBook,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllPriceBooks,
  getPriceBookById,
  createPriceBook,
  updatePriceBook,
  deletePriceBook,
};
