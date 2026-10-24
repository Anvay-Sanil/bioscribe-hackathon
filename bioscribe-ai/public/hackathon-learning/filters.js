/* Table-only views over report rows. Never change the report or its metrics. */
(function (root) {
  "use strict";
  function filterRows(rows, query = "", label = "all") {
    if (!["all", "positive", "negative", "unknown"].includes(label)) throw new RangeError("Unsupported invented-label filter");
    const search = query.trim(), idSearch = search.toLowerCase();
    return rows.filter(row => {
      const labelMatches = label === "all" || (label === "positive" && row.test_label === true) || (label === "negative" && row.test_label === false) || (label === "unknown" && row.test_label === null);
      // SMILES is a literal, case-sensitive substring; C and c are different.
      const searchMatches = !search || row.record_id.toLowerCase().includes(idSearch) || Boolean(row.chemistry?.canonical_isomeric_smiles.includes(search));
      return labelMatches && searchMatches;
    });
  }
  const api = { filterRows };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.LearningFilters = api;
})(globalThis);
