"""
AtomNet File Upload Service
Parse and validate CSV/JSON files from external screening engines
"""

import csv
import json
import io
import hashlib
from datetime import datetime
from typing import Optional, List, Dict, Any, Tuple
from pydantic import BaseModel, Field
from enum import Enum


class FileFormat(str, Enum):
    """Supported file formats for screening results"""
    CSV = "csv"
    JSON = "json"


class ColumnMapping(BaseModel):
    """Column name mappings for different engines"""
    ligand_id: str = "ligand_id"
    smiles: str = "smiles"
    score: str = "score"
    rank: Optional[str] = None
    molecular_weight: Optional[str] = None
    logp: Optional[str] = None


class FormatTemplate(BaseModel):
    """Predefined format template for a screening engine"""
    name: str
    description: str
    format: FileFormat
    mapping: ColumnMapping
    score_multiplier: float = 1.0  # Some engines use positive scores
    example_row: str


# ============================================================================
# PREDEFINED FORMAT TEMPLATES
# ============================================================================

FORMAT_TEMPLATES: Dict[str, FormatTemplate] = {
    "atomnet": FormatTemplate(
        name="AtomNet CSV",
        description="Atomwise AtomNet virtual screening output",
        format=FileFormat.CSV,
        mapping=ColumnMapping(
            ligand_id="molecule_id",
            smiles="smiles",
            score="atomnet_score",
            rank="rank"
        ),
        score_multiplier=1.0,
        example_row="molecule_id,smiles,atomnet_score,rank"
    ),
    "gnina": FormatTemplate(
        name="GNINA CSV",
        description="GNINA CNN-based docking output",
        format=FileFormat.CSV,
        mapping=ColumnMapping(
            ligand_id="name",
            smiles="smiles",
            score="CNNaffinity",
            rank=None
        ),
        score_multiplier=-1.0,  # GNINA uses positive scores
        example_row="name,smiles,CNNaffinity,CNNscore"
    ),
    "vina": FormatTemplate(
        name="AutoDock Vina CSV",
        description="AutoDock Vina docking results",
        format=FileFormat.CSV,
        mapping=ColumnMapping(
            ligand_id="ligand",
            smiles="smiles",
            score="affinity",
            rank=None
        ),
        score_multiplier=1.0,
        example_row="ligand,smiles,affinity,rmsd_lb,rmsd_ub"
    ),
    "generic_csv": FormatTemplate(
        name="Generic CSV",
        description="Standard CSV with ID, SMILES, and score columns",
        format=FileFormat.CSV,
        mapping=ColumnMapping(
            ligand_id="id",
            smiles="smiles",
            score="score"
        ),
        score_multiplier=1.0,
        example_row="id,smiles,score"
    ),
    "generic_json": FormatTemplate(
        name="Generic JSON",
        description="JSON array of ligand objects",
        format=FileFormat.JSON,
        mapping=ColumnMapping(
            ligand_id="id",
            smiles="smiles",
            score="score"
        ),
        score_multiplier=1.0,
        example_row='[{"id": "LIG001", "smiles": "CCO", "score": -8.5}]'
    )
}


class UploadValidationResult(BaseModel):
    """Result of file upload validation"""
    valid: bool
    warnings: List[str] = []
    errors: List[str] = []
    ligand_count: int = 0
    score_range: Tuple[float, float] = (0.0, 0.0)
    detected_format: Optional[str] = None
    suggested_mapping: Optional[ColumnMapping] = None


class ParsedLigand(BaseModel):
    """Parsed ligand from uploaded file"""
    ligand_id: str
    smiles: str
    score: float
    rank: Optional[int] = None
    molecular_weight: Optional[float] = None
    logp: Optional[float] = None
    extra_data: Dict[str, Any] = {}


class FileUploadService:
    """Service for parsing and validating uploaded screening results"""
    
    MIN_LIGANDS = 10
    
    @classmethod
    def detect_format(cls, content: str, filename: str) -> Tuple[FileFormat, Optional[str]]:
        """Detect file format and suggest template"""
        # Check file extension first
        if filename.endswith('.json'):
            return FileFormat.JSON, "generic_json"
        
        # Try JSON parsing
        try:
            json.loads(content)
            return FileFormat.JSON, "generic_json"
        except json.JSONDecodeError:
            pass
        
        # Assume CSV
        # Check header for known patterns
        first_line = content.split('\n')[0].lower()
        
        if 'atomnet' in first_line or 'molecule_id' in first_line:
            return FileFormat.CSV, "atomnet"
        elif 'cnnaffinity' in first_line or 'cnnscore' in first_line:
            return FileFormat.CSV, "gnina"
        elif 'affinity' in first_line and 'rmsd' in first_line:
            return FileFormat.CSV, "vina"
        
        return FileFormat.CSV, "generic_csv"
    
    @classmethod
    def auto_detect_mapping(cls, content: str, file_format: FileFormat) -> ColumnMapping:
        """Auto-detect column mapping from file content"""
        if file_format == FileFormat.JSON:
            data = json.loads(content)
            if isinstance(data, list) and len(data) > 0:
                keys = list(data[0].keys())
            else:
                keys = []
        else:
            first_line = content.split('\n')[0]
            reader = csv.reader(io.StringIO(first_line))
            keys = next(reader, [])
        
        keys_lower = [k.lower().strip() for k in keys]
        
        # Find ID column
        id_col = keys[0]  # Default to first column
        for pattern in ['id', 'ligand_id', 'molecule_id', 'name', 'compound']:
            for i, k in enumerate(keys_lower):
                if pattern in k:
                    id_col = keys[i]
                    break
        
        # Find SMILES column
        smiles_col = None
        for pattern in ['smiles', 'smi', 'canonical']:
            for i, k in enumerate(keys_lower):
                if pattern in k:
                    smiles_col = keys[i]
                    break
            if smiles_col:
                break
        
        # Find score column
        score_col = None
        for pattern in ['score', 'affinity', 'energy', 'cnn', 'atomnet', 'dock']:
            for i, k in enumerate(keys_lower):
                if pattern in k:
                    score_col = keys[i]
                    break
            if score_col:
                break
        
        return ColumnMapping(
            ligand_id=id_col,
            smiles=smiles_col or keys[1] if len(keys) > 1 else "smiles",
            score=score_col or keys[2] if len(keys) > 2 else "score"
        )
    
    @classmethod
    def validate_content(
        cls, 
        content: str, 
        file_format: FileFormat,
        mapping: ColumnMapping
    ) -> UploadValidationResult:
        """Validate file content before import"""
        result = UploadValidationResult(valid=True)
        
        try:
            if file_format == FileFormat.JSON:
                data = json.loads(content)
                if not isinstance(data, list):
                    result.errors.append("JSON must be an array of ligand objects")
                    result.valid = False
                    return result
                rows = data
            else:
                reader = csv.DictReader(io.StringIO(content))
                rows = list(reader)
            
            result.ligand_count = len(rows)
            
            # Check minimum ligands
            if result.ligand_count < cls.MIN_LIGANDS:
                result.warnings.append(
                    f"Only {result.ligand_count} ligands found. "
                    f"Typical screens have 50-10,000+ compounds."
                )
            
            # Check for required columns
            if rows:
                first_row = rows[0]
                if mapping.ligand_id not in first_row:
                    result.errors.append(f"Missing ID column: {mapping.ligand_id}")
                    result.valid = False
                if mapping.smiles not in first_row:
                    result.errors.append(f"Missing SMILES column: {mapping.smiles}")
                    result.valid = False
                if mapping.score not in first_row:
                    result.errors.append(f"Missing score column: {mapping.score}")
                    result.valid = False
            
            if not result.valid:
                return result
            
            # Parse scores and check distribution
            scores = []
            for row in rows:
                try:
                    score = float(row.get(mapping.score, 0))
                    scores.append(score)
                except (ValueError, TypeError):
                    pass
            
            if scores:
                result.score_range = (min(scores), max(scores))
                
                # Check if all scores are identical
                if len(set(scores)) == 1:
                    result.warnings.append(
                        "All scores are identical. This may indicate dummy data or a parsing issue."
                    )
                
                # Check score range
                if result.score_range[0] > 0:
                    result.warnings.append(
                        "Scores are positive. Docking scores are typically negative (kcal/mol). "
                        "Consider applying a sign flip."
                    )
            
        except Exception as e:
            result.errors.append(f"Failed to parse file: {str(e)}")
            result.valid = False
        
        return result
    
    @classmethod
    def parse_file(
        cls,
        content: str,
        file_format: FileFormat,
        mapping: ColumnMapping,
        score_multiplier: float = 1.0
    ) -> List[ParsedLigand]:
        """Parse file content into ligand objects"""
        ligands = []
        
        if file_format == FileFormat.JSON:
            rows = json.loads(content)
        else:
            reader = csv.DictReader(io.StringIO(content))
            rows = list(reader)
        
        for i, row in enumerate(rows):
            try:
                ligand = ParsedLigand(
                    ligand_id=str(row.get(mapping.ligand_id, f"LIG_{i+1:05d}")),
                    smiles=str(row.get(mapping.smiles, "")),
                    score=float(row.get(mapping.score, 0)) * score_multiplier,
                    rank=int(row.get(mapping.rank)) if mapping.rank and row.get(mapping.rank) else None,
                    molecular_weight=float(row.get(mapping.molecular_weight)) if mapping.molecular_weight and row.get(mapping.molecular_weight) else None,
                    logp=float(row.get(mapping.logp)) if mapping.logp and row.get(mapping.logp) else None,
                    extra_data={k: v for k, v in row.items() if k not in [
                        mapping.ligand_id, mapping.smiles, mapping.score,
                        mapping.rank, mapping.molecular_weight, mapping.logp
                    ]}
                )
                ligands.append(ligand)
            except (ValueError, TypeError) as e:
                continue  # Skip malformed rows
        
        # Sort by score and assign ranks if not present
        ligands.sort(key=lambda x: x.score)
        for i, lig in enumerate(ligands):
            if lig.rank is None:
                lig.rank = i + 1
        
        return ligands


def get_format_templates() -> List[FormatTemplate]:
    """Get all available format templates"""
    return list(FORMAT_TEMPLATES.values())


def get_template(template_id: str) -> Optional[FormatTemplate]:
    """Get a specific format template"""
    return FORMAT_TEMPLATES.get(template_id)
