import type { Evidence, RunView } from './contract';

export type MoleculeRow = {
  index: number; smiles: string | null; hash: string; identityHash?: string | null; status: string;
  mw: Evidence | undefined; logp: Evidence | undefined; tpsa: Evidence | undefined;
  score: Evidence | undefined; fields: Evidence[];
};

export function moleculeRows(run: RunView): MoleculeRow[] {
  if (run.status !== 'succeeded' || !run.artifact) return [];
  return run.artifact.chemical_identities.map((identity, index) => {
    const fields = run.artifact!.outputs.filter(f => f.field_id.startsWith(`molecule.${index}.`));
    const quantity = (name: string) => fields.find(f => f.quantity === name);
    return {index, smiles: identity.canonical_isomeric_smiles, hash: identity.input_sha256, identityHash:'identity_sha256' in identity?identity.identity_sha256:null, status: identity.status,
      mw: quantity('molecular_weight'), logp: quantity('calculated_logp'), tpsa: quantity('tpsa'),
      score: quantity('descriptor_distance'), fields};
  });
}

export function numberValue(field: Evidence | undefined): number | null {
  return field?.assessment_status === 'computed' && field.execution_status === 'succeeded' &&
    field.domain === 'in_domain' && field.coverage.complete && typeof field.value === 'number' && Number.isFinite(field.value) ? field.value : null;
}

// Selection is a library-wide operation. Unsupported or duplicate identities
// withhold the entire selection; searching the table never changes eligibility.
export function shortlist(rows: MoleculeRow[], budget: number): {rows: MoleculeRow[]; reason: string | null} {
  if (!Number.isInteger(budget) || budget < 1 || budget > rows.length) return {rows: [], reason: 'Choose a budget between 1 and the library size.'};
  if (rows.some(row => row.status !== 'identified' || !row.smiles || numberValue(row.score) === null))
    return {rows: [], reason: 'Incomplete molecular coverage. No shortlist is assessed.'};
  if (new Set(rows.map(row => row.smiles)).size !== rows.length)
    return {rows: [], reason: 'Repeated canonical identities require review. No shortlist is assessed.'};
  const tie=(r:MoleculeRow)=>r.identityHash||r.hash;
  return {rows: [...rows].sort((a, b) => numberValue(a.score)! - numberValue(b.score)! || (tie(a) < tie(b) ? -1 : tie(a) > tie(b) ? 1 : a.index - b.index)).slice(0, budget), reason: null};
}

export function selectionExport(run: RunView, budget: number) {
  const selected = shortlist(moleculeRows(run), budget);
  const current=run.artifact?.contract_version==='3.1.0';
  return {schema: current?'bioscribe-shortlist/1.1':'bioscribe-shortlist/1.0', run_id: run.run_id, request_sha256: run.request_sha256,
    artifact_sha256: run.artifact_sha256, budget, status: selected.reason ? 'not_assessed' : 'computed',
    reason: selected.reason, method: current?'prioritization_heuristic/1.2.0':'prioritization_heuristic/1.1.0', direction: 'ascending',
    tie_break: current?'identity_sha256 ascending; source index ascending':'input_sha256 ascending; source index ascending (legacy spelling-dependent rule)', scientific_assessment: 'not_assessed',
    interpretation: 'Target-independent descriptor distance; no affinity, safety or hit-rate prediction.',
    selected: selected.rows.map(row => ({source_index: row.index, input_sha256: row.hash, canonical_isomeric_smiles: row.smiles, score: row.score})),
    source_run: run};
}

export type Conformer = {name: string; input_smiles: string; input_sha256: string; canonical_isomeric_smiles: string;
  molblock: string; molblock_sha256: string; method: string; version: string; seed: number; optimization_status: string; interpretation: string};

export function conformerFor(row: MoleculeRow | undefined, library: Conformer[]) {
  return row?.status === 'identified' ? library.find(c => c.canonical_isomeric_smiles === row.smiles) : undefined;
}

export function saveJSON(value: unknown, name: string) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], {type:'application/json'}));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
