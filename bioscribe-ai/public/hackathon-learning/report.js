/* Local learning-report checks and file-loading state. No network or persistence. */
(function (root) {
  "use strict";
  const MAX_FILE_BYTES = 4 * 1024 * 1024;
  // These are the field contracts emitted by the supported learning replay.
  // Do not relabel values from other units or method versions implicitly.
  const FIELD_CONTRACTS = {
    molecular_weight: { method: "rdkit_descriptors", version: "1.1.0", units: "g/mol", evidence_category: "computed_descriptor" },
    tpsa: { method: "rdkit_descriptors", version: "1.1.0", units: "angstrom^2", evidence_category: "computed_descriptor" },
    heuristic: { method: "prioritization_heuristic", version: "1.1.0", units: "dimensionless", evidence_category: "unvalidated_heuristic" },
    qed: { method: "rdkit_qed_WEIGHT_MEAN", version: "2025.03.3", units: "dimensionless", evidence_category: "computed_descriptor" },
  };
  const isObject = value => value !== null && typeof value === "object" && !Array.isArray(value);
  const integer = value => Number.isSafeInteger(value) && value >= 0;
  const hash = value => typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
  function check(condition) {
    if (!condition) throw new Error("This file is not a consistent synthetic learning replay report.");
  }

  function checkComputedField(field, contract) {
    check(isObject(field) && Number.isFinite(field.value));
    check(field.assessment_status === "computed");
    for (const [key, value] of Object.entries(contract)) check(field[key] === value);
    check(field.coverage === "whole_accepted_graph");
    check(field.validation_record === null && field.predictive_domain === "not_established");
  }

  function parseReport(text) {
    let report;
    try { report = JSON.parse(text); }
    catch { throw new Error("This file is not valid JSON. Choose an exported learning report."); }
    check(isObject(report) && report.schema_version === "learning-replay/1.0.0");
    check(report.data_class === "synthetic_software_fixture");
    check(report.input_policy === "plain_smiles_concrete_graph/1.1.0");
    check(report.scientific_assessment === "not_assessed" && report.qualification_status === "not_assessed");
    check(report.scientific_release === "blocked" && report.sensitive_intake === "blocked");
    check(report.study_execution === "not_performed" && report.confidence_bounds === null);
    check(["complete", "incomplete", "insufficient_evidence"].includes(report.status));
    check(integer(report.selection_budget) && report.selection_budget >= 1 && report.selection_budget <= 128);
    check(Array.isArray(report.rows) && report.rows.length >= 1 && report.rows.length <= 128);
    check(isObject(report.coverage));
    const records = new Set(), entities = new Map();
    let scored = 0, unknown = 0;
    for (const row of report.rows) {
      check(isObject(row) && typeof row.record_id === "string" && /^[A-Za-z0-9_-]{1,64}$/.test(row.record_id));
      check(!records.has(row.record_id)); records.add(row.record_id);
      check(row.label_origin === "fabricated_for_software_demonstration");
      check(typeof row.test_label === "boolean" || row.test_label === null);
      if (row.test_label === null) unknown++;
      if (row.status === "computed") {
        const chemistry = row.chemistry;
        check(isObject(chemistry) && hash(chemistry.entity_sha256) && !entities.has(chemistry.entity_sha256));
        check(typeof chemistry.canonical_isomeric_smiles === "string" && chemistry.canonical_isomeric_smiles.length <= 2048);
        for (const [key, contract] of Object.entries(FIELD_CONTRACTS)) {
          checkComputedField(chemistry[key], contract);
        }
        entities.set(chemistry.entity_sha256, row); scored++;
      } else check(row.status === "unsupported_input" && row.chemistry === null);
    }
    check(report.coverage.input_rows === report.rows.length && report.coverage.scored_rows === scored);
    check(report.coverage.unsupported_rows === report.rows.length - scored && report.coverage.unknown_test_labels === unknown);
    if (report.status !== "complete") {
      // Unavailable outcomes must never carry selections or metrics from another run.
      check(report.selections === null && report.synthetic_label_counts === null && report.conditional_metrics === null);
      if (report.status === "insufficient_evidence") check(unknown > 0);
      return report;
    }
    check(unknown === 0 && scored === report.rows.length && scored >= report.selection_budget);
    check(isObject(report.selections) && isObject(report.synthetic_label_counts) && isObject(report.conditional_metrics));
    const selected = {};
    for (const method of ["heuristic", "qed"]) {
      const ids = report.selections[`${method}_entity_sha256`];
      check(Array.isArray(ids) && ids.length === report.selection_budget && new Set(ids).size === ids.length);
      check(ids.every(id => entities.has(id)));
      selected[method] = ids.map(id => entities.get(id));
    }
    const h = selected.heuristic.filter(row => row.test_label).length;
    const q = selected.qed.filter(row => row.test_label).length;
    const a = report.rows.filter(row => row.test_label).length;
    const n = report.rows.length, budget = report.selection_budget, counts = report.synthetic_label_counts;
    check(counts.population_positive === a && counts.heuristic_positive === h && counts.qed_positive === q && counts.additional_positive === h - q);
    check(report.selections.overlap_count === selected.heuristic.filter(row => report.selections.qed_entity_sha256.includes(row.chemistry.entity_sha256)).length);
    const ratios = { heuristic_precision: [h, budget], qed_precision: [q, budget], precision_difference: [h - q, budget], expected_random_hits: [budget * a, n], enrichment: [h * n, budget * a] };
    for (const [key, [numerator, denominator]] of Object.entries(ratios)) {
      const metric = report.conditional_metrics[key];
      check(isObject(metric) && metric.numerator === numerator && metric.denominator === denominator);
      if (denominator === 0) check(metric.value === null && metric.status === "undefined");
      else check(metric.status === "computed" && Number.isFinite(metric.value) && Math.abs(metric.value - numerator / denominator) <= 1e-12);
    }
    return report;
  }

  function createLoader(publish) {
    let generation = 0;
    function clear() {
      generation++;
      publish({ phase: "empty", report: null, fileName: "", error: null });
    }
    async function load(file) {
      const current = ++generation;
      const fileName = typeof file.name === "string" ? file.name : "Report JSON";
      publish({ phase: "loading", report: null, fileName, error: null });
      try {
        if (!integer(file.size) || file.size > MAX_FILE_BYTES) throw new Error("Choose a report smaller than 4 MiB.");
        const text = await file.text();
        if (current !== generation) return;
        const report = parseReport(text);
        publish({ phase: "ready", report, fileName, error: null });
      } catch (error) {
        if (current === generation) publish({ phase: "error", report: null, fileName, error: error instanceof Error ? error.message : "Could not read this report." });
      }
    }
    return { load, clear };
  }

  const api = { parseReport, createLoader, MAX_FILE_BYTES };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.LearningReport = api;
})(globalThis);
