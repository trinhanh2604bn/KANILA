const express = require("express");
const router = express.Router();
const { getAllShipmentEvents, getShipmentEventById, getEventsByShipmentId, createShipmentEvent, deleteShipmentEvent } = require("../controllers/shipmentEvent.controller");
router.get("/", getAllShipmentEvents);
router.get("/shipment/:shipmentId", getEventsByShipmentId);
router.get("/:id", getShipmentEventById);
router.post("/", createShipmentEvent);
router.delete("/:id", deleteShipmentEvent);
module.exports = router;
