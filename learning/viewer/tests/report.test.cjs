"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { parseReport, createLoader, MAX_FILE_BYTES } = require("../report.js");
const reports = path.resolve(__dirname, "../../exercises/budget-and-unknown");
const text = name => fs.readFileSync(path.join(reports, `${name}-result.json`), "utf8");
const file = (name, contents) => ({ name, size: Buffer.byteLength(contents), text: async () => contents });

for (const name of ["budget-100", "budget-10", "budget-10-unknown"]) {
  test(`accept the saved ${name} report without dropping molecular rows`, () => {
    const report = parseReport(text(name));
    assert.equal(report.rows.length, 120);
    assert.equal(report.coverage.scored_rows, 120);
    if (name.endsWith("unknown")) {
      assert.equal(report.status, "insufficient_evidence");
      assert.equal(report.selections, null);
      assert.equal(report.conditional_metrics, null);
    } else assert.equal(report.selections.heuristic_entity_sha256.length, report.selection_budget);
  });
}

// Include the unknown-label export: unavailable comparisons must not bypass
// validation of the molecular calculations that remain visible.
for (const field of ["molecular_weight", "tpsa", "heuristic", "qed"]) {
  for (const [property, invalid] of [["assessment_status", "not_assessed"], ["units", "kg/mol"], ["method", "unsupported_method"], ["version", "999.0.0"]]) {
    test(`reject ${field} with contradictory or missing ${property} in every saved report`, () => {
      for (const name of ["budget-100", "budget-10", "budget-10-unknown"]) {
        for (const missing of [false, true]) {
          const report = JSON.parse(text(name));
          const value = report.rows[0].chemistry[field];
          if (missing) delete value[property];
          else value[property] = invalid;
          assert.throws(() => parseReport(JSON.stringify(report)), /not a consistent synthetic learning replay report/, `${name}: ${field}.${property}, missing=${missing}`);
        }
      }
    });
  }
}

test("reject contradictory field evidence, coverage and validation claims", () => {
  for (const field of ["molecular_weight", "tpsa", "heuristic", "qed"]) {
    for (const [property, invalid] of [["evidence_category", "validated_prediction"], ["coverage", "partial_graph"], ["validation_record", "invented-qualification"], ["predictive_domain", "established"]]) {
      for (const missing of [false, true]) {
        const report = JSON.parse(text("budget-10-unknown"));
        if (missing) delete report.rows[0].chemistry[field][property];
        else report.rows[0].chemistry[field][property] = invalid;
        assert.throws(() => parseReport(JSON.stringify(report)), /not a consistent synthetic learning replay report/);
      }
    }
  }
});

test("reject missing or unsupported parser policies", () => {
  for (const policy of [null, "plain_smiles_concrete_graph/9.0.0"]) {
    const report = JSON.parse(text("budget-10"));
    if (policy === null) delete report.input_policy;
    else report.input_policy = policy;
    assert.throws(() => parseReport(JSON.stringify(report)));
  }
});

test("contradictory field metadata clears a previously displayed report", async () => {
  const states = [], loader = createLoader(state => states.push(state));
  for (const [field, property, invalid] of [["heuristic", "assessment_status", "not_assessed"], ["molecular_weight", "units", "kg/mol"]]) {
    await loader.load(file("known.json", text("budget-10")));
    assert.equal(states.at(-1).phase, "ready");
    const report = JSON.parse(text("budget-10"));
    report.rows[0].chemistry[field][property] = invalid;
    const pending = loader.load(file("contradictory.json", JSON.stringify(report)));
    assert.equal(states.at(-1).phase, "loading");
    assert.equal(states.at(-1).report, null);
    await pending;
    assert.equal(states.at(-1).phase, "error");
    assert.equal(states.at(-1).report, null);
  }
});

test("switching files clears the previous report synchronously before reading", async () => {
  const states = [], loader = createLoader(state => states.push(state));
  await loader.load(file("known.json", text("budget-10")));
  let resolve;
  const pending = loader.load({ name: "unknown.json", size: 1, text: () => new Promise(done => { resolve = done; }) });
  assert.equal(states.at(-1).phase, "loading");
  assert.equal(states.at(-1).report, null);
  resolve(text("budget-10-unknown"));
  await pending;
  assert.equal(states.at(-1).report.status, "insufficient_evidence");
  assert.equal(states.at(-1).report.conditional_metrics, null);
});

test("a slow old file cannot overwrite a more recently selected file", async () => {
  let last, resolve;
  const loader = createLoader(state => { last = state; });
  const slow = loader.load({ name: "slow.json", size: 1, text: () => new Promise(done => { resolve = done; }) });
  await loader.load(file("unknown.json", text("budget-10-unknown")));
  resolve(text("budget-10"));
  await slow;
  assert.equal(last.fileName, "unknown.json");
  assert.equal(last.report.status, "insufficient_evidence");
});

test("clear cancels an in-flight read", async () => {
  let last, resolve;
  const loader = createLoader(state => { last = state; });
  const pending = loader.load({ name: "slow.json", size: 1, text: () => new Promise(done => { resolve = done; }) });
  loader.clear();
  resolve(text("budget-10"));
  await pending;
  assert.equal(last.phase, "empty");
  assert.equal(last.report, null);
});

test("invalid JSON replaces previous selections with an error state", async () => {
  let last;
  const loader = createLoader(state => { last = state; });
  await loader.load(file("known.json", text("budget-10")));
  await loader.load(file("broken.json", "{"));
  assert.equal(last.phase, "error");
  assert.equal(last.report, null);
});

test("oversized and unreadable files leave no previous report", async () => {
  let last, read = false;
  const loader = createLoader(state => { last = state; });
  await loader.load({ name: "large.json", size: MAX_FILE_BYTES + 1, text: async () => { read = true; } });
  assert.equal(read, false);
  assert.equal(last.report, null);
  await loader.load({ name: "unreadable.json", size: 1, text: async () => { throw new Error("Cannot read file"); } });
  assert.equal(last.phase, "error");
  assert.equal(last.report, null);
});

test("reject unrelated reports, altered counts, unknown selection IDs and stale aggregates", () => {
  const mutations = [
    r => { r.data_class = "clinical"; },
    r => { r.coverage.scored_rows = 119; },
    r => { r.synthetic_label_counts.heuristic_positive = 7; },
    r => { r.selections.qed_entity_sha256[0] = "0".repeat(64); },
    r => { r.selections.qed_entity_sha256[0] = r.selections.qed_entity_sha256[1]; },
    r => { r.rows[0].chemistry.heuristic.value = "0.2"; },
    r => { r.conditional_metrics.enrichment.value = 900; },
    r => { r.status = "insufficient_evidence"; r.rows[0].test_label = null; r.coverage.unknown_test_labels = 1; },
  ];
  for (const mutate of mutations) {
    const report = JSON.parse(text("budget-10")); mutate(report);
    assert.throws(() => parseReport(JSON.stringify(report)));
  }
});

test("zero-positive enrichment stays unavailable rather than becoming zero", () => {
  const report = JSON.parse(text("budget-10"));
  for (const row of report.rows) row.test_label = false;
  report.synthetic_label_counts = { population_positive: 0, heuristic_positive: 0, qed_positive: 0, additional_positive: 0 };
  for (const [key, denominator] of [["heuristic_precision", 10], ["qed_precision", 10], ["precision_difference", 10], ["expected_random_hits", 120]]) report.conditional_metrics[key] = { numerator: 0, denominator, value: 0, status: "computed" };
  report.conditional_metrics.enrichment = { numerator: 0, denominator: 0, value: null, status: "undefined" };
  assert.equal(parseReport(JSON.stringify(report)).conditional_metrics.enrichment.value, null);
});
