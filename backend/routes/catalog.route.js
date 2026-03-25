const express = require("express");
const router = express.Router();
const { getCatalogBundle, getCatalogFacets } = require("../controllers/catalog.controller");

router.get("/facets", getCatalogFacets);
router.get("/", getCatalogBundle);

module.exports = router;
