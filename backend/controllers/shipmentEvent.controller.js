const ShipmentEvent = require("../models/shipmentEvent.model");
const validateObjectId = require("../utils/validateObjectId");

const getAllShipmentEvents = async (req, res) => {
  try {
    const events = await ShipmentEvent.find().populate("shipmentId", "shipmentNumber trackingNumber").sort({ eventTime: -1 });
    res.status(200).json({ success: true, message: "Get all shipment events successfully", count: events.length, data: events });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const getShipmentEventById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const event = await ShipmentEvent.findById(id).populate("shipmentId", "shipmentNumber trackingNumber");
    if (!event) return res.status(404).json({ success: false, message: "Shipment event not found" });
    res.status(200).json({ success: true, message: "Get shipment event successfully", data: event });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const getEventsByShipmentId = async (req, res) => {
  try {
    const { shipmentId } = req.params;
    if (!validateObjectId(shipmentId)) return res.status(400).json({ success: false, message: "Invalid shipment ID" });
    const events = await ShipmentEvent.find({ shipmentId }).sort({ eventTime: -1 });
    res.status(200).json({ success: true, message: "Get events by shipment successfully", count: events.length, data: events });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const createShipmentEvent = async (req, res) => {
  try {
    const { shipmentId, eventCode } = req.body;
    if (!shipmentId || !eventCode) return res.status(400).json({ success: false, message: "shipmentId and eventCode are required" });
    const event = await ShipmentEvent.create(req.body);
    res.status(201).json({ success: true, message: "Shipment event created successfully", data: event });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const deleteShipmentEvent = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const event = await ShipmentEvent.findByIdAndDelete(id);
    if (!event) return res.status(404).json({ success: false, message: "Shipment event not found" });
    res.status(200).json({ success: true, message: "Shipment event deleted successfully", data: event });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

module.exports = { getAllShipmentEvents, getShipmentEventById, getEventsByShipmentId, createShipmentEvent, deleteShipmentEvent };
