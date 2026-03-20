const PriceBookEntry = require("../models/priceBookEntry.model");
const PriceBook = require("../models/priceBook.model");
const ProductVariant = require("../models/productVariant.model");
const PriceHistory = require("../models/priceHistory.model");
const validateObjectId = require("../utils/validateObjectId");

// GET /api/price-book-entries
const getAllPriceBookEntries = async (req, res) => {
  try {
    const entries = await PriceBookEntry.find()
      .populate("priceBookId", "priceBookCode priceBookName currencyCode")
      .populate("variantId", "sku variantName")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Get all price book entries successfully",
      count: entries.length,
      data: entries,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/price-book-entries/:id
const getPriceBookEntryById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid entry ID" });
    }

    const entry = await PriceBookEntry.findById(id)
      .populate("priceBookId", "priceBookCode priceBookName currencyCode")
      .populate("variantId", "sku variantName");

    if (!entry) {
      return res.status(404).json({ success: false, message: "Price book entry not found" });
    }

    res.status(200).json({
      success: true,
      message: "Get price book entry successfully",
      data: entry,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/price-book-entries/price-book/:priceBookId
const getEntriesByPriceBookId = async (req, res) => {
  try {
    const { priceBookId } = req.params;

    if (!validateObjectId(priceBookId)) {
      return res.status(400).json({ success: false, message: "Invalid price book ID" });
    }

    const entries = await PriceBookEntry.find({ priceBookId })
      .populate("variantId", "sku variantName")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Get entries by price book successfully",
      count: entries.length,
      data: entries,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/price-book-entries/variant/:variantId
const getEntriesByVariantId = async (req, res) => {
  try {
    const { variantId } = req.params;

    if (!validateObjectId(variantId)) {
      return res.status(400).json({ success: false, message: "Invalid variant ID" });
    }

    const entries = await PriceBookEntry.find({ variantId })
      .populate("priceBookId", "priceBookCode priceBookName currencyCode")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Get entries by variant successfully",
      count: entries.length,
      data: entries,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/price-book-entries
const createPriceBookEntry = async (req, res) => {
  try {
    const { priceBookId, variantId, listPriceAmount, salePriceAmount } = req.body;

    if (!priceBookId || !variantId || listPriceAmount === undefined) {
      return res.status(400).json({
        success: false,
        message: "priceBookId, variantId, and listPriceAmount are required",
      });
    }

    if (!validateObjectId(priceBookId)) {
      return res.status(400).json({ success: false, message: "Invalid priceBookId" });
    }
    if (!validateObjectId(variantId)) {
      return res.status(400).json({ success: false, message: "Invalid variantId" });
    }

    // Verify references exist
    const priceBookExists = await PriceBook.findById(priceBookId);
    if (!priceBookExists) {
      return res.status(404).json({ success: false, message: "Price book not found" });
    }

    const variantExists = await ProductVariant.findById(variantId);
    if (!variantExists) {
      return res.status(404).json({ success: false, message: "Product variant not found" });
    }

    // Validate salePriceAmount <= listPriceAmount
    if (salePriceAmount !== undefined && salePriceAmount > listPriceAmount) {
      return res.status(400).json({
        success: false,
        message: "Sale price must not be greater than list price",
      });
    }

    const entry = await PriceBookEntry.create(req.body);

    res.status(201).json({
      success: true,
      message: "Price book entry created successfully",
      data: entry,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/price-book-entries/:id
const updatePriceBookEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const { listPriceAmount, salePriceAmount, changeReason, changedByAccountId } = req.body;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid entry ID" });
    }

    const existingEntry = await PriceBookEntry.findById(id);
    if (!existingEntry) {
      return res.status(404).json({ success: false, message: "Price book entry not found" });
    }

    // Determine the effective values after update
    const newList = listPriceAmount !== undefined ? listPriceAmount : existingEntry.listPriceAmount;
    const newSale = salePriceAmount !== undefined ? salePriceAmount : existingEntry.salePriceAmount;

    // Validate salePriceAmount <= listPriceAmount
    if (newSale > newList) {
      return res.status(400).json({
        success: false,
        message: "Sale price must not be greater than list price",
      });
    }

    // Auto-create price history if price is changing
    const priceChanged =
      (listPriceAmount !== undefined && listPriceAmount !== existingEntry.listPriceAmount) ||
      (salePriceAmount !== undefined && salePriceAmount !== existingEntry.salePriceAmount);

    if (priceChanged) {
      const priceBook = await PriceBook.findById(existingEntry.priceBookId);
      await PriceHistory.create({
        variantId: existingEntry.variantId,
        priceBookId: existingEntry.priceBookId,
        currencyCode: priceBook ? priceBook.currencyCode : "VND",
        oldListPriceAmount: existingEntry.listPriceAmount,
        oldSalePriceAmount: existingEntry.salePriceAmount,
        newListPriceAmount: newList,
        newSalePriceAmount: newSale,
        changeReason: changeReason || "",
        changedByAccountId: changedByAccountId || null,
      });
    }

    // Remove helper fields before updating entry
    delete req.body.changeReason;
    delete req.body.changedByAccountId;

    const entry = await PriceBookEntry.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: priceChanged
        ? "Price book entry updated successfully (price history recorded)"
        : "Price book entry updated successfully",
      data: entry,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/price-book-entries/:id
const deletePriceBookEntry = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid entry ID" });
    }

    const entry = await PriceBookEntry.findByIdAndDelete(id);

    if (!entry) {
      return res.status(404).json({ success: false, message: "Price book entry not found" });
    }

    res.status(200).json({
      success: true,
      message: "Price book entry deleted successfully",
      data: entry,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllPriceBookEntries,
  getPriceBookEntryById,
  getEntriesByPriceBookId,
  getEntriesByVariantId,
  createPriceBookEntry,
  updatePriceBookEntry,
  deletePriceBookEntry,
};
