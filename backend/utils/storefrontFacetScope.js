/**
 * Optional catalog facet scoping: when `storefrontOnly=1` (or true), facet list endpoints
 * only return rows tied to storefront-visible products (active + not inactive).
 * Default behavior unchanged when the flag is absent.
 */

function parseStorefrontFacetFlag(query) {
  if (!query) return false;
  const v = query.storefrontOnly ?? query.catalogFacet;
  if (v === undefined || v === null || String(v).trim() === "") return false;
  const s = String(v).toLowerCase().trim();
  return s === "1" || s === "true" || s === "yes";
}

/**
 * Sub-pipeline for `$lookup` on Product; parent must `let: { pid: "$productId" }` (or matching field).
 */
function storefrontProductLookupPipeline() {
  return [
    {
      $match: {
        $expr: { $eq: ["$_id", "$$pid"] },
        isActive: { $ne: false },
        productStatus: { $ne: "inactive" },
      },
    },
    { $limit: 1 },
  ];
}

module.exports = {
  parseStorefrontFacetFlag,
  storefrontProductLookupPipeline,
};
