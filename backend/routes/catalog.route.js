const express = require("express");
const router = express.Router();
const {
  getCatalogBundle,
  getCatalogFacets,
  getDistinctShades,
  getDistinctSkinTypes,
} = require("../controllers/catalog.controller");

router.get("/facets", getCatalogFacets);
router.get("/shades", getDistinctShades);
router.get("/skin-types", getDistinctSkinTypes);
router.get("/", getCatalogBundle);

module.exports = router;
