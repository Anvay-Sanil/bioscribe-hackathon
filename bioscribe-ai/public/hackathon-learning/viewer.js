/* Render every report from scratch; text-only DOM insertion keeps file content inert. */
(function () {
  "use strict";
  const element = id => document.getElementById(id);
  let currentReport = null;
  const statuses = { complete: "Complete", incomplete: "Incomplete", insufficient_evidence: "Insufficient evidence" };
  const format = value => Number.isFinite(value) ? value.toLocaleString("en", { maximumFractionDigits: 4 }) : "Not assessed";
  function metric(value) {
    return value?.status === "computed" ? `${value.numerator}/${value.denominator} · ${format(value.value)}` : "Not assessed";
  }
  function put(id, value) { element(id).textContent = value; }
  function render(state) {
    const report = state.report;
    currentReport = report;
    element("download-example").disabled = !report;
    element("molecule-search").value = "";
    element("label-filter").value = "all";
    element("molecule-search").disabled = !report;
    element("label-filter").disabled = !report;
    put("load-message", state.phase === "loading" ? `Opening ${state.fileName}…` : state.phase === "ready" ? `Loaded ${state.fileName}` : state.phase === "error" ? "Report unavailable. Choose another JSON file." : "No report loaded. Start with budget-10-result.json, then open budget-10-unknown-result.json.");
    element("load-error").hidden = !state.error;
    put("load-error", state.error || "");
    put("budget-value", report ? String(report.selection_budget) : "Not assessed");
    put("status-value", report ? statuses[report.status] : "Not assessed");
    put("status-detail", !report ? "Open a report to begin" : report.status === "complete" ? "Invented-label comparison available" : report.status === "insufficient_evidence" ? "Unknown labels; comparisons unavailable" : "Incomplete molecular coverage or selection");
    put("scored-value", report ? String(report.coverage.scored_rows) : "Not assessed");
    put("scored-detail", report ? `Of ${report.coverage.input_rows} input molecules` : "Input coverage");

    for (const method of ["heuristic", "qed"]) {
      const list = element(`${method}-selection`);
      list.replaceChildren();
      const available = report?.status === "complete";
      element(`${method}-unavailable`).hidden = available;
      put(`${method}-count`, available ? `${report.synthetic_label_counts[`${method}_positive`]} / ${report.selection_budget}` : "Not assessed");
      if (available) {
        const byHash = new Map(report.rows.filter(row => row.chemistry).map(row => [row.chemistry.entity_sha256, row]));
        for (const hash of report.selections[`${method}_entity_sha256`]) {
          const row = byHash.get(hash), li = document.createElement("li"), label = document.createElement("span");
          li.append(document.createTextNode(row.record_id));
          li.title = `Canonical identity: ${hash}`;
          label.textContent = row.test_label ? "Invented positive" : "Invented negative";
          li.append(label); list.append(li);
        }
      }
    }
    const metrics = report?.status === "complete" ? report.conditional_metrics : null;
    put("difference-value", metric(metrics?.precision_difference));
    put("random-value", metric(metrics?.expected_random_hits));
    put("enrichment-value", metric(metrics?.enrichment));

    element("unknown-note").hidden = !report?.coverage.unknown_test_labels;
    put("unknown-note", report?.coverage.unknown_test_labels ? `${report.coverage.unknown_test_labels} unknown invented label(s). Molecular calculations remain available; outcome comparisons are Not assessed.` : "");
    renderMolecules();
  }

  function renderMolecules() {
    const report = currentReport;
    const query = element("molecule-search").value, labelFilter = element("label-filter").value;
    const rows = LearningFilters.filterRows(report?.rows || [], query, labelFilter);
    const body = element("molecule-rows");
    body.replaceChildren();
    for (const row of rows) {
      const tr = document.createElement("tr"), c = row.chemistry;
      for (const [index, value] of [row.record_id, c?.canonical_isomeric_smiles || "Not assessed", format(c?.molecular_weight.value), format(c?.tpsa.value), format(c?.heuristic.value), format(c?.qed.value)].entries()) {
        const td = document.createElement("td"); td.textContent = value;
        if (index === 1) { td.className = "smiles"; td.title = value; td.tabIndex = 0; td.setAttribute("aria-label", `Canonical SMILES: ${value}`); }
        tr.append(td);
      }
      const td = document.createElement("td"), label = document.createElement("span");
      label.textContent = row.test_label === null ? "Unknown" : row.test_label ? "Invented positive" : "Invented negative";
      label.className = row.test_label === null ? "label-unknown" : row.test_label ? "label-positive" : "";
      td.append(label); tr.append(td); body.append(tr);
    }
    element("molecule-empty").hidden = rows.length > 0;
    put("molecule-empty", report ? "No molecules match your search and label filter." : "Your molecular calculations will appear here.");
    put("molecule-caption", report ? `Showing ${rows.length} of ${report.rows.length} molecules` : "No molecules loaded");
    element("clear-filters").disabled = !report || (!query && labelFilter === "all");
  }

  const loader = LearningReport.createLoader(render);
  element("report-file").addEventListener("change", event => {
    const file = event.target.files[0];
    if (file) void loader.load(file);
    event.target.value = "";
  });
  element("clear-report").addEventListener("click", () => loader.clear());
  element("molecule-search").addEventListener("input", renderMolecules);
  element("label-filter").addEventListener("change", renderMolecules);
  element("clear-filters").addEventListener("click", () => {
    element("molecule-search").value = "";
    element("label-filter").value = "all";
    renderMolecules();
  });
  document.querySelectorAll('[data-example]').forEach(button => button.addEventListener('click', () => {
    const key = button.dataset.example;
    void loader.load(new File([JSON.stringify(HackathonExamples[key])], `${key}-synthetic.json`, {type:'application/json'}));
  }));
  element('download-example').addEventListener('click', () => {
    if (!currentReport) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(currentReport, null, 2)], {type:'application/json'}));
    const link = document.createElement('a'); link.href=url; link.download='bioscribe-synthetic-comparison.json'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  loader.clear();
})();
