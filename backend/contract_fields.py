"""Exported evidence must state metadata explicitly; construction defaults are not evidence."""
from pydantic import BaseModel


def require_complete(value):
    if isinstance(value, BaseModel):
        if set(type(value).model_fields) != value.model_fields_set:
            raise ValueError("missing_evidence_metadata")
        for name in type(value).model_fields:
            require_complete(getattr(value, name))
    elif isinstance(value, dict):
        for child in value.values():
            require_complete(child)
    elif isinstance(value, list):
        for child in value:
            require_complete(child)
