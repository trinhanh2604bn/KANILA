const Address = require("../models/address.model");
const Customer = require("../models/customer.model");
const validateObjectId = require("../utils/validateObjectId");

// GET /api/addresses
const getAllAddresses = async (req, res) => {
  try {
    const addresses = await Address.find()
      .populate("customerId", "customerCode fullName")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Get all addresses successfully",
      count: addresses.length,
      data: addresses,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/addresses/:id
const getAddressById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid address ID" });
    }

    const address = await Address.findById(id).populate(
      "customerId",
      "customerCode fullName"
    );

    if (!address) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }

    res.status(200).json({
      success: true,
      message: "Get address successfully",
      data: address,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/addresses/customer/:customerId
const getAddressesByCustomerId = async (req, res) => {
  try {
    const { customerId } = req.params;

    if (!validateObjectId(customerId)) {
      return res.status(400).json({ success: false, message: "Invalid customer ID" });
    }

    const addresses = await Address.find({ customerId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Get addresses by customer successfully",
      count: addresses.length,
      data: addresses,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/addresses
const createAddress = async (req, res) => {
  try {
    const { customerId, recipientName, phone, addressLine1, city, isDefaultShipping, isDefaultBilling } = req.body;

    // Required fields check
    if (!customerId || !recipientName || !phone || !addressLine1 || !city) {
      return res.status(400).json({
        success: false,
        message: "customerId, recipientName, phone, addressLine1, and city are required",
      });
    }

    if (!validateObjectId(customerId)) {
      return res.status(400).json({ success: false, message: "Invalid customerId" });
    }

    // Verify customer exists
    const customerExists = await Customer.findById(customerId);
    if (!customerExists) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    // Handle default shipping — unset others if this one is default
    if (isDefaultShipping === true) {
      await Address.updateMany(
        { customerId, isDefaultShipping: true },
        { isDefaultShipping: false }
      );
    }

    // Handle default billing — unset others if this one is default
    if (isDefaultBilling === true) {
      await Address.updateMany(
        { customerId, isDefaultBilling: true },
        { isDefaultBilling: false }
      );
    }

    const address = await Address.create(req.body);

    res.status(201).json({
      success: true,
      message: "Address created successfully",
      data: address,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/addresses/:id
const updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const { isDefaultShipping, isDefaultBilling } = req.body;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid address ID" });
    }

    // Find the address first to get its customerId
    const existingAddress = await Address.findById(id);
    if (!existingAddress) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }

    const customerId = existingAddress.customerId;

    // Handle default shipping — unset others if this one is being set as default
    if (isDefaultShipping === true) {
      await Address.updateMany(
        { customerId, _id: { $ne: id }, isDefaultShipping: true },
        { isDefaultShipping: false }
      );
    }

    // Handle default billing — unset others if this one is being set as default
    if (isDefaultBilling === true) {
      await Address.updateMany(
        { customerId, _id: { $ne: id }, isDefaultBilling: true },
        { isDefaultBilling: false }
      );
    }

    const address = await Address.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: "Address updated successfully",
      data: address,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/addresses/:id
const deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid address ID" });
    }

    const address = await Address.findByIdAndDelete(id);

    if (!address) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }

    res.status(200).json({
      success: true,
      message: "Address deleted successfully",
      data: address,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllAddresses,
  getAddressById,
  getAddressesByCustomerId,
  createAddress,
  updateAddress,
  deleteAddress,
};
