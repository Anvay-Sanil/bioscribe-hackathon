"""An intentionally small, honest RDKit baseline, not another product.

Default MolFromSmiles parser, canonical SMILES, molecular weight and TPSA.
No evidence schema, identity curation policy, reference lookup or replay wrapper.
The comparison measures the wrapper's explicit policies, not superior chemistry.
"""
from rdkit import Chem, rdBase
from rdkit.Chem import Descriptors, rdMolDescriptors


def describe(smiles):
    with rdBase.BlockLogs():
        try:
            mol = Chem.MolFromSmiles(smiles)
            if mol is None:
                return {"status": "rejected", "canonical_smiles": None, "molecular_weight": None, "tpsa": None}
            return {"status": "computed", "canonical_smiles": Chem.MolToSmiles(mol, isomericSmiles=True),
                    "molecular_weight": round(Descriptors.MolWt(mol), 8), "tpsa": round(rdMolDescriptors.CalcTPSA(mol), 8)}
        except (ValueError, RuntimeError):
            return {"status": "calculation_error", "canonical_smiles": None, "molecular_weight": None, "tpsa": None}
