"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { filterRows } = require("../filters.js");
const { parseReport } = require("../report.js");
const report = name => parseReport(fs.readFileSync(path.resolve(__dirname, `../../exercises/budget-and-unknown/${name}-result.json`), "utf8"));
const ids = rows => rows.map(row => row.record_id);

test("unknown filter shows only alkane-028; clearing it restores all 120 rows", () => {
  const source = report("budget-10-unknown");
  assert.deepEqual(ids(filterRows(source.rows, "", "unknown")), ["alkane-028"]);
  assert.equal(filterRows(source.rows, "", "all").length, 120);
  assert.equal(source.conditional_metrics, null);
});

test("invented-label filters never count unknown as negative", () => {
  const source = report("budget-10-unknown");
  assert.equal(filterRows(source.rows, "", "positive").length, 16);
  assert.equal(filterRows(source.rows, "", "negative").length, 103);
  assert.equal(filterRows(source.rows, "", "unknown").length, 1);
});

test("ID search ignores case, trims outer whitespace and accepts partial IDs", () => {
  const source = report("budget-10");
  assert.deepEqual(ids(filterRows(source.rows, "  ALKANE-028  ")), ["alkane-028"]);
  assert.equal(filterRows(source.rows, "alkane-02").length, 10);
});

test("canonical SMILES search is a literal, case-sensitive substring", () => {
  const rows = [
    { record_id: "r1", test_label: true, chemistry: { canonical_isomeric_smiles: "CCl" } },
    { record_id: "r2", test_label: false, chemistry: { canonical_isomeric_smiles: "c1ccccc1" } },
    { record_id: "r3", test_label: null, chemistry: { canonical_isomeric_smiles: "[Na+].[Cl-]" } },
  ];
  assert.deepEqual(ids(filterRows(rows, "C")), ["r1", "r3"]);
  assert.deepEqual(ids(filterRows(rows, "c1")), ["r2"]);
  assert.deepEqual(ids(filterRows(rows, "[Na+].")), ["r3"]);
  assert.deepEqual(filterRows(rows, ".*"), []);
});

test("search and label filters combine without reranking", () => {
  const source = report("budget-10");
  assert.deepEqual(ids(filterRows(source.rows, "ALKANE-02", "positive")), ["alkane-021", "alkane-028"]);
  assert.deepEqual(filterRows(source.rows, "alkane-028", "negative"), []);
});

test("no matches produce an empty table view without changing coverage", () => {
  const source = report("budget-10-unknown");
  assert.deepEqual(filterRows(source.rows, "no-such-molecule"), []);
  assert.equal(source.coverage.scored_rows, 120);
});

test("empty or whitespace search restores the full row order", () => {
  const source = report("budget-100");
  assert.deepEqual(ids(filterRows(source.rows, "")), ids(source.rows));
  assert.deepEqual(ids(filterRows(source.rows, "   ")), ids(source.rows));
});

test("filtering leaves report selections, counts, metrics and rows untouched", () => {
  for (const name of ["budget-100", "budget-10", "budget-10-unknown"]) {
    const source = report(name), before = JSON.stringify(source);
    Object.freeze(source.rows);
    for (const row of source.rows) Object.freeze(row);
    for (const label of ["all", "positive", "negative", "unknown"]) filterRows(source.rows, "alkane-02", label);
    assert.equal(JSON.stringify(source), before);
  }
});

test("unsupported chemistry can be found by ID but never by placeholder text", () => {
  const rows = [{ record_id: "unparsed", test_label: null, chemistry: null }];
  assert.deepEqual(filterRows(rows, "UNPARSED", "unknown"), rows);
  assert.deepEqual(filterRows(rows, "Not assessed"), []);
});

test("unknown filter names are rejected", () => {
  assert.throws(() => filterRows([], "", "unsupported"), RangeError);
});
