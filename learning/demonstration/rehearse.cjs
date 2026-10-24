/* Rehearse the four presentation steps without changing the viewer or reports. */
"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const { parseReport } = require("../viewer/report.js");
const folder = __dirname;
const root = path.resolve(folder, "../..");
const reports = path.join(root, "learning/exercises/budget-and-unknown");
const output = path.join(folder, "evidence");
fs.mkdirSync(output, { recursive: true });
const read = file => fs.readFileSync(file, "utf8");
const valid = JSON.parse(read(path.join(reports, "budget-10-result.json")));
const manifest = JSON.parse(read(path.join(folder, "fixtures/manifest.json")));
for (const fixture of manifest.fixtures) {
  const expected = structuredClone(valid);
  expected.rows[0].chemistry[fixture.field][fixture.property] = fixture.invalid_value;
  const raw = read(path.join(folder, "fixtures", fixture.file));
  assert.deepEqual(JSON.parse(raw), expected, "Only the declared metadata field may differ");
  assert.throws(() => parseReport(raw), /not a consistent synthetic learning replay report/);
}
for (const name of ["budget-100", "budget-10", "budget-10-unknown"]) parseReport(read(path.join(reports, `${name}-result.json`)));

(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_BROWSER_CHANNEL ? { channel: process.env.PLAYWRIGHT_BROWSER_CHANNEL } : {}) });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  const browserErrors = [], httpRequests = [], steps = [];
  page.on("pageerror", error => browserErrors.push(error.message));
  page.on("request", request => { if (/^https?:/.test(request.url())) httpRequests.push(request.url()); });
  const expectText = async (selector, expected) => assert.equal(await page.locator(selector).textContent(), expected);
  const open = file => page.locator("#report-file").setInputFiles(file);
  const capture = async (name, observation) => {
    await page.screenshot({ path: path.join(output, `${name}.png`), fullPage: true });
    steps.push({ name, observation, screenshot: `${name}.png` });
  };
  const unavailable = async () => {
    for (const id of ["heuristic-count", "qed-count", "difference-value", "random-value", "enrichment-value"]) await expectText(`#${id}`, "Not assessed");
    assert.equal(await page.locator("#heuristic-selection li, #qed-selection li").count(), 0);
  };
  try {
    await page.goto(pathToFileURL(path.join(root, "learning/viewer/index.html")).href);
    await open(path.join(reports, "budget-100-result.json"));
    await page.waitForFunction(() => document.querySelector("#budget-value").textContent === "100");
    await expectText("#scored-value", "120");
    await expectText("#heuristic-count", "14 / 100");
    await expectText("#qed-count", "14 / 100");
    assert.equal(await page.locator("#heuristic-selection li").count(), 100);
    assert.equal(await page.locator("#qed-selection li").count(), 100);
    await capture("01-budget-100", "120 scored; 100 selected per method; both invented-positive counts 14/100");

    await open(path.join(reports, "budget-10-result.json"));
    await page.waitForFunction(() => document.querySelector("#budget-value").textContent === "10");
    await expectText("#scored-value", "120");
    await expectText("#heuristic-count", "2 / 10");
    await expectText("#qed-count", "1 / 10");
    assert.equal(await page.locator("#heuristic-selection li").count(), 10);
    assert.equal(await page.locator("#qed-selection li").count(), 10);
    await capture("02-budget-10", "120 scored; 10 selected per method; invented positives 2/10 vs 1/10");

    await open(path.join(reports, "budget-10-unknown-result.json"));
    await page.waitForFunction(() => document.querySelector("#status-value").textContent === "Insufficient evidence");
    await unavailable(); await expectText("#scored-value", "120");
    assert.equal(await page.locator("#molecule-rows tr").count(), 120);
    await capture("03-unknown-label", "All 120 calculations retained; selections and comparisons Not assessed");

    await page.locator("#molecule-search").fill("alkane-028");
    await page.locator("#label-filter").selectOption("unknown");
    await expectText("#molecule-caption", "Showing 1 of 120 molecules");
    assert.deepEqual(await page.locator("#molecule-rows td:first-child").allTextContents(), ["alkane-028"]);
    await unavailable(); await expectText("#scored-value", "120");
    await capture("04-find-alkane-028", "Only alkane-028 displayed; report-level comparisons remain Not assessed");

    await page.locator("#clear-filters").click();
    await expectText("#molecule-caption", "Showing 120 of 120 molecules");
    assert.equal(await page.locator("#molecule-rows tr").count(), 120);
    await unavailable();
    await capture("05-restore-all", "All 120 rows restored; comparisons still Not assessed");

    let index = 6;
    for (const fixture of manifest.fixtures) {
      await open(path.join(reports, "budget-10-result.json"));
      await page.waitForFunction(() => document.querySelector("#status-value").textContent === "Complete");
      await expectText("#heuristic-count", "2 / 10");
      await open(path.join(folder, "fixtures", fixture.file));
      await page.waitForFunction(() => !document.querySelector("#load-error").hidden);
      assert.match(await page.locator("#load-error").textContent(), /not a consistent synthetic learning replay report/);
      await unavailable();
      await expectText("#budget-value", "Not assessed");
      assert.equal(await page.locator("#molecule-rows tr").count(), 0);
      await capture(`${String(index++).padStart(2,"0")}-${fixture.field}-rejected`, `Rejected ${fixture.field}.${fixture.property}=${fixture.invalid_value}; previous values cleared`);
    }
    assert.deepEqual(browserErrors, []); assert.deepEqual(httpRequests, []);
    const result = { purpose: "Synthetic learning demonstration only", fixture_checks: 2, valid_exports_accepted: 3, browser_steps_passed: steps.length, steps, browserErrors, httpRequests, execution: "Automated headless Edge rehearsal; no human presentation or interactive in-app rerun claimed" };
    fs.writeFileSync(path.join(output, "rehearsal.json"), JSON.stringify(result, null, 2)+"\n");
    console.log(JSON.stringify(result, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode=1; });
