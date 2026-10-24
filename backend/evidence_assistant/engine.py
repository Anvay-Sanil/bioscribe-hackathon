"""Conservative source-record checker. Unparsed semantics never become support."""
from collections import defaultdict
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
import re
import uuid
from .corpus import canonical, eligibility, load_corpus, sha
from .schemas import Citation, Review, ReviewRequest, Statement

NUMBER = r"(?:\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)"
ASSAY = re.compile(rf"(?P<molecule>CHEMBL\d+)\s+in\s+activity\s+(?P<activity>\d+)\s+has\s+(?P<endpoint>IC50|EC50|AC50|Ki|Kd|Potency)\s*(?P<relation><=|>=|=|<|>)\s*(?P<value>{NUMBER})\s*(?P<units>nM|uM|µM|μM|mM|M)", re.I)
RUN = re.compile(rf"(?P<molecule>\S+)\s+in\s+run\s+(?P<run>[a-f0-9]{{32}})\s+has\s+(?P<endpoint>molecular_weight|calculated_logp|tpsa|qed|aromatic_heavy_atom_fraction|descriptor_distance)\s*(?P<relation><=|>=|=|<|>)\s*(?P<value>{NUMBER})\s+(?P<units>g/mol|dimensionless|angstrom\^2)", re.I)
UNITS = {"nm": Decimal("1"), "um": Decimal("1000"), "µm": Decimal("1000"), "μm": Decimal("1000"), "mm": Decimal("1000000"), "m": Decimal("1000000000")}


def split_statements(text):
    # Decimal periods and conjunction context are retained. Conjunction clauses can
    # carry negation/qualification; never sever them to manufacture an atomic fact.
    spans = []
    pattern = r"(?:[;\n]+|(?<=[.!?])\s+(?=[A-Z]))"
    start = 0
    for boundary in list(re.finditer(pattern, text)) + [None]:
        end = boundary.start() if boundary else len(text)
        while start < end and text[start].isspace(): start += 1
        while end > start and text[end - 1].isspace(): end -= 1
        if start < end:
            spans.append((start, end, text[start:end]))
        start = boundary.end() if boundary else len(text)
    if not 1 <= len(spans) <= 16:
        raise ValueError("statement_limit")
    return spans


def parse_statement(text):
    clean = text.rstrip(".!?").strip()
    if re.search(r"\b(and|but)\b", clean, re.I):
        return "unparsed", None
    # Any clinical/efficacy claim stays outside this research-record scope.
    if re.search(r"\b(safe|safety|cures?|effective treatment|efficacy|treats?|non.?toxic|no side effects|safe dose)\b", clean, re.I):
        return "efficacy_or_safety", None
    for pattern, category in ((ASSAY, "assay_observation"), (RUN, "computed_property")):
        match = pattern.fullmatch(clean)
        if match:
            return category, match.groupdict()
    if re.search(r"\b(inhibits?|binds?|active|inactive|IC50|EC50|Ki|Kd|activity|potency)\b", clean, re.I):
        return "activity", None
    return "unparsed", None


def citation(source, role):
    if source["kind"] == "assay_record":
        locator = "/activity/standard_value (with standard_type, standard_relation, standard_units and assay_chembl_id)"
        excerpt = canonical({"activity_id": int(source["activity_id"]), "assay_chembl_id": source["assay_id"],
            "molecule_chembl_id": source["molecule_id"], "standard_type": source["endpoint"],
            "standard_relation": source["relation"], "standard_value": source["value"], "standard_units": source["units"]})
        retraction = source["publication_check"]["status"]
    else:
        locator, excerpt, retraction = source["locator"], canonical(source["property"]), "not_applicable"
    return Citation(source_id=source["source_id"], kind=source["kind"], role=role, locator=locator,
                    url=source.get("url"), source_sha256=source["raw_sha256"], excerpt=excerpt, retraction_status=retraction)


def retrieve(text, records, k=8):
    tokens = set(re.findall(r"[a-z0-9]+", text.lower()))
    scored = []
    for row in records:
        hay = canonical({key: row.get(key) for key in ("molecule_id", "molecule_name", "activity_id", "assay_id", "endpoint", "target_name", "organism", "run_id")}).lower()
        score = sum(token in hay for token in tokens)
        if row.get("activity_id") and re.search(r"\b" + row["activity_id"] + r"\b", text): score += 100
        if score: scored.append((score, row["source_id"], row))
    return [item[2] for item in sorted(scored, key=lambda item: (-item[0], item[1]))[:k]]


def disagreements(records, selected_molecules):
    groups = defaultdict(list)
    for row in records:
        if row["kind"] == "assay_record" and row["molecule_id"] in selected_molecules and not eligibility(row):
            groups[(row["molecule_id"], row["target_id"], row["organism"], row["endpoint"], row["units"])].append(row)
    result = []
    for key, rows in sorted(groups.items()):
        if len({row["assay_id"] for row in rows}) < 2 or len({Decimal(row["value"]) for row in rows}) < 2:
            continue
        result.append({"molecule_id": key[0], "target_id": key[1], "organism": key[2], "endpoint": key[3], "units": key[4],
            "interpretation": "Different recorded values across assays; experimental contexts may differ. No averaging or universal biological contradiction is inferred.",
            "observations": [{"assay_id": row["assay_id"], "value": row["value"], "assay_description": row["assay_description"], "citation": citation(row, "context").model_dump()} for row in rows]})
    return result


def review(payload, records=None, corpus_hash=None, run_id=None):
    request = ReviewRequest.model_validate(payload)
    if records is None: records, corpus_hash = load_corpus()
    corpus_hash = corpus_hash or sha(canonical(records))
    run_id = run_id or uuid.uuid4().hex
    spans = split_statements(request.text)
    output, excluded, molecules = [], {}, set()
    model_info = {"status": "not_requested", "id": None, "used_for_verdict": False}
    if request.use_model:
        from .model import suggest
        # Suggestions are never elevated to evidence or verdicts. Unsupported
        # free-text semantics continue to abstain under the bounded grammar.
        model_info = suggest(request.text, records)
    for index, (start, end, text) in enumerate(spans):
        category, atom = parse_statement(text)
        candidates = retrieve(text, records)
        citations = []
        verdict, reason, explanation = "insufficient_evidence", "unresolved_statement", "This statement is outside the implemented exact-record grammar. Review its meaning and scope; no scientific conclusion was inferred."
        basis = "abstention"
        if category == "efficacy_or_safety":
            verdict, reason, explanation, basis = "out_of_scope", "efficacy_or_safety_scope", "This research assistant does not assess treatment efficacy, clinical safety or dosing.", "scope_policy"
        elif atom:
            if category == "assay_observation":
                exact = [r for r in records if r["kind"] == "assay_record" and r["activity_id"] == atom["activity"]]
            else:
                exact = [r for r in records if r["kind"] == "run_record" and r["run_id"] == atom["run"] and r["endpoint"].lower() == atom["endpoint"].lower() and r["molecule_name"].lower() == atom["molecule"].lower()]
            for row in exact:
                problem = eligibility(row)
                if problem:
                    excluded[row["source_id"]] = {"source_id": row["source_id"], "reason": problem}
                    citations.append(citation(row, "excluded"))
                    reason, explanation = problem, "The matching record is excluded by the evidence-quality or publication-status policy. It cannot support or contradict this claim."
                    continue
                if category == "assay_observation":
                    molecules.add(row["molecule_id"])
                    if row["molecule_id"].lower() != atom["molecule"].lower() or row["endpoint"].lower() != atom["endpoint"].lower():
                        citations.append(citation(row, "context"))
                        reason, explanation = "identity_or_endpoint_mismatch", "The cited activity belongs to a different molecule or endpoint; its value is not transferable to this statement."
                        continue
                    observed = Decimal(row["value"])
                    claimed = Decimal(atom["value"]) * UNITS[atom["units"].lower()]
                else:
                    if row["property"].get("availability") != "computed" or row["property"].get("value") is None or row["units"].lower() != atom["units"].lower():
                        citations.append(citation(row, "context"))
                        reason, explanation = "property_not_comparable", "The run does not contain a computed value with the claimed units."
                        continue
                    observed, claimed = Decimal(str(row["property"]["value"])), Decimal(atom["value"])
                relation = atom["relation"]
                agrees = {"=": observed == claimed, "<": observed < claimed, ">": observed > claimed, "<=": observed <= claimed, ">=": observed >= claimed}[relation]
                verdict = "supported" if agrees else "contradicted"
                reason, basis = "exact_record_comparison", "exact_record_comparison"
                explanation = "The statement agrees with this specific recorded value and units." if agrees else "The statement disagrees with this specific recorded value and units."
                explanation += " This verdict concerns the record, not general biological activity, efficacy or safety."
                citations.append(citation(row, "supports" if agrees else "contradicts"))
                break
            if not exact:
                reason, explanation = "record_not_in_frozen_corpus", "No matching source record was found in this bounded frozen collection. Absence here is not evidence of biological inactivity."
        elif category == "activity":
            reason, explanation = "activity_requires_specific_experimental_context", "A general activity statement requires experimental context and adequate direct evidence. Computed molecular properties cannot establish activity; no activity conclusion was inferred."
        if not citations:
            for row in candidates[:3]:
                problem = eligibility(row)
                if problem:
                    excluded[row["source_id"]] = {"source_id": row["source_id"], "reason": problem}
                citations.append(citation(row, "excluded" if problem else "context"))
                if row["kind"] == "assay_record": molecules.add(row["molecule_id"])
        trace = {"statement": text, "reason_code": reason, "corpus_sha256": corpus_hash, "retrieved_source_ids": [r["source_id"] for r in candidates]}
        citations.append(Citation(source_id="review:" + run_id, kind="run_record", role="assessment_trace",
            locator=f"/statements/{index}", url=None, source_sha256=sha(canonical(trace)), excerpt=canonical(trace), retraction_status="not_applicable"))
        output.append(Statement(statement_id=f"s{index + 1}", text=text, start=start, end=end, category=category,
            verdict=verdict, reason_code=reason, explanation=explanation, citations=citations, decision_basis=basis,
            requires_review=verdict in ("insufficient_evidence", "out_of_scope")))
    return Review(run_id=run_id, input_sha256=sha(canonical(request.model_dump())), corpus_sha256=corpus_hash,
        created_utc=datetime.now(timezone.utc).isoformat(), text=request.text, statements=output,
        decomposition={"method": "span_preserving_bounded_rules/0.1.0", "all_text_retained": True,
                       "semantic_completeness": "not_established", "unresolved_clauses_require_review": True},
        disagreements=disagreements(records, molecules), excluded_sources=list(excluded.values()), model=model_info,
        evidence_scope="Frozen ChEMBL assay records and recorded BioScribe computations. Publication flags checked as-of snapshot; refresh required after 30 days. No exhaustive literature search or clinical interpretation.")
