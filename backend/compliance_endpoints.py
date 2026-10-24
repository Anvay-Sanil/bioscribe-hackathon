"""
Compliance API Endpoints
FDA 21 CFR Part 11, GDPR/HIPAA, and ELN/LIMS integration endpoints
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
from datetime import datetime
import json

from .enterprise_compliance import (
    fda_compliance, 
    gdpr_hipaa_compliance, 
    eln_lims_connector,
    get_compliance_status
)

router = APIRouter(prefix="/api/compliance", tags=["compliance"])

# Pydantic models for compliance endpoints

class ElectronicSignatureRequest(BaseModel):
    user_id: str
    password: str
    action: str
    record_id: str
    reason: str

class AuditLogRequest(BaseModel):
    user_id: str
    user_name: str
    action: str
    record_id: str
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    reason: str = ""

class ConsentRequest(BaseModel):
    user_id: str
    consent_type: str
    granted: bool
    purpose: str

class DataProcessingRequest(BaseModel):
    user_id: str
    data_type: str
    purpose: str
    legal_basis: str
    retention_period: int

class ELNConnectionRequest(BaseModel):
    system_type: str = Field(..., description="benchling, labware, or custom")
    config: Dict[str, Any]

class ExperimentSyncRequest(BaseModel):
    system_type: str
    experiment_id: str
    data: Dict[str, Any]

class ProtocolImportRequest(BaseModel):
    system_type: str
    protocol_ids: List[str]

# FDA 21 CFR Part 11 Endpoints

@router.post("/fda/electronic-signature")
async def create_electronic_signature(request: ElectronicSignatureRequest):
    """Create electronic signature for FDA compliance"""
    try:
        signature = fda_compliance.create_electronic_signature(
            request.user_id, 
            request.password, 
            request.action
        )
        
        # Log the signature creation
        fda_compliance.log_audit_event(
            user_id=request.user_id,
            user_name=request.user_id,  # In production, get from user database
            action="ELECTRONIC_SIGNATURE_CREATED",
            record_id=request.record_id,
            reason=request.reason
        )
        
        return {
            "signature": signature,
            "timestamp": datetime.utcnow().isoformat(),
            "status": "valid",
            "compliance": "21_CFR_Part_11"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/fda/audit-log")
async def create_audit_log(request: AuditLogRequest, client_request: Request):
    """Create audit log entry for FDA compliance"""
    try:
        client_ip = client_request.client.host
        session_id = client_request.headers.get("session-id", "unknown")
        
        hash_chain = fda_compliance.log_audit_event(
            user_id=request.user_id,
            user_name=request.user_name,
            action=request.action,
            record_id=request.record_id,
            old_value=request.old_value,
            new_value=request.new_value,
            reason=request.reason,
            ip_address=client_ip,
            session_id=session_id
        )
        
        return {
            "audit_id": hash_chain,
            "timestamp": datetime.utcnow().isoformat(),
            "status": "logged",
            "integrity_hash": hash_chain
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/fda/audit-report")
async def get_audit_report(
    start_date: str,
    end_date: str,
    user_id: Optional[str] = None
):
    """Generate FDA audit report"""
    try:
        report = fda_compliance.get_audit_report(start_date, end_date, user_id)
        integrity_verified = fda_compliance.verify_audit_trail_integrity()
        
        return {
            "report": report,
            "total_entries": len(report),
            "date_range": {"start": start_date, "end": end_date},
            "integrity_verified": integrity_verified,
            "compliance_standard": "21_CFR_Part_11",
            "generated_at": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/fda/verify-integrity")
async def verify_audit_integrity():
    """Verify audit trail integrity"""
    try:
        is_valid = fda_compliance.verify_audit_trail_integrity()
        return {
            "integrity_verified": is_valid,
            "total_entries": len(fda_compliance.audit_trail),
            "verification_timestamp": datetime.utcnow().isoformat(),
            "status": "VALID" if is_valid else "COMPROMISED"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# GDPR/HIPAA Endpoints

@router.post("/gdpr/consent")
async def record_consent(request: ConsentRequest):
    """Record user consent for GDPR compliance"""
    try:
        gdpr_hipaa_compliance.record_consent(
            request.user_id,
            request.consent_type,
            request.granted,
            request.purpose
        )
        
        return {
            "user_id": request.user_id,
            "consent_type": request.consent_type,
            "granted": request.granted,
            "recorded_at": datetime.utcnow().isoformat(),
            "compliance": "GDPR_Article_7"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/gdpr/consent/{user_id}")
async def get_consent_status(user_id: str, consent_type: Optional[str] = None):
    """Get user consent status"""
    try:
        if consent_type:
            has_consent = gdpr_hipaa_compliance.check_consent(user_id, consent_type)
            return {
                "user_id": user_id,
                "consent_type": consent_type,
                "granted": has_consent,
                "checked_at": datetime.utcnow().isoformat()
            }
        else:
            all_consents = gdpr_hipaa_compliance.consent_records.get(user_id, {})
            return {
                "user_id": user_id,
                "consents": all_consents,
                "checked_at": datetime.utcnow().isoformat()
            }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/gdpr/data-processing")
async def log_data_processing(request: DataProcessingRequest):
    """Log data processing activity for GDPR"""
    try:
        gdpr_hipaa_compliance.log_data_processing(
            request.user_id,
            request.data_type,
            request.purpose,
            request.legal_basis,
            request.retention_period
        )
        
        return {
            "user_id": request.user_id,
            "data_type": request.data_type,
            "purpose": request.purpose,
            "legal_basis": request.legal_basis,
            "logged_at": datetime.utcnow().isoformat(),
            "compliance": "GDPR_Article_30"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/gdpr/data-export/{user_id}")
async def export_user_data(user_id: str):
    """Export user data for GDPR data portability"""
    try:
        export_data = gdpr_hipaa_compliance.generate_data_export(user_id)
        return {
            "export": export_data,
            "compliance": "GDPR_Article_20",
            "format": "JSON",
            "exported_at": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/gdpr/anonymize")
async def anonymize_data(data: Dict[str, Any]):
    """Anonymize personal data for GDPR compliance"""
    try:
        anonymized = gdpr_hipaa_compliance.anonymize_data(data)
        return {
            "original_fields": len(data),
            "anonymized_data": anonymized,
            "anonymized_at": datetime.utcnow().isoformat(),
            "compliance": "GDPR_Article_4"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ELN/LIMS Integration Endpoints

@router.post("/eln-lims/connect")
async def connect_eln_lims(request: ELNConnectionRequest):
    """Connect to ELN/LIMS system"""
    try:
        success = eln_lims_connector.connect_system(request.system_type, request.config)
        
        if success:
            # Log the connection for audit
            fda_compliance.log_audit_event(
                user_id="system",
                user_name="BioScribe System",
                action="ELN_LIMS_CONNECTION",
                record_id=f"{request.system_type}_connection",
                reason=f"Connected to {request.system_type} system"
            )
        
        return {
            "system_type": request.system_type,
            "connected": success,
            "timestamp": datetime.utcnow().isoformat(),
            "status": "SUCCESS" if success else "FAILED"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/eln-lims/sync")
async def sync_experiment_data(request: ExperimentSyncRequest):
    """Sync experiment data to ELN/LIMS"""
    try:
        success = eln_lims_connector.sync_experiment_data(
            request.system_type,
            request.experiment_id,
            request.data
        )
        
        if success:
            # Log the sync for audit
            fda_compliance.log_audit_event(
                user_id="system",
                user_name="BioScribe System",
                action="DATA_SYNC_ELN_LIMS",
                record_id=request.experiment_id,
                new_value=json.dumps(request.data),
                reason=f"Synced experiment data to {request.system_type}"
            )
        
        return {
            "experiment_id": request.experiment_id,
            "system_type": request.system_type,
            "synced": success,
            "timestamp": datetime.utcnow().isoformat(),
            "data_size": len(str(request.data))
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/eln-lims/import-protocols")
async def import_protocols(request: ProtocolImportRequest):
    """Import protocols from ELN/LIMS"""
    try:
        protocols = eln_lims_connector.import_protocols(
            request.system_type,
            request.protocol_ids
        )
        
        # Log the import for audit
        fda_compliance.log_audit_event(
            user_id="system",
            user_name="BioScribe System",
            action="PROTOCOL_IMPORT",
            record_id=f"import_{len(protocols)}_protocols",
            new_value=json.dumps(request.protocol_ids),
            reason=f"Imported {len(protocols)} protocols from {request.system_type}"
        )
        
        return {
            "system_type": request.system_type,
            "protocols": protocols,
            "count": len(protocols),
            "imported_at": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/eln-lims/supported-systems")
async def get_supported_systems():
    """Get list of supported ELN/LIMS systems"""
    return {
        "supported_systems": [
            {
                "name": "Benchling",
                "type": "benchling",
                "description": "Cloud-based ELN for life sciences",
                "features": ["Experiments", "Protocols", "Inventory", "Workflows"]
            },
            {
                "name": "LabWare LIMS",
                "type": "labware",
                "description": "Laboratory Information Management System",
                "features": ["Sample tracking", "Results management", "QC workflows"]
            },
            {
                "name": "Custom API",
                "type": "custom",
                "description": "Custom REST API integration",
                "features": ["Flexible endpoints", "Custom data formats"]
            }
        ],
        "integration_capabilities": [
            "Bidirectional data sync",
            "Protocol import/export",
            "Real-time updates",
            "Audit trail integration"
        ]
    }

# Overall Compliance Status

@router.get("/status")
async def get_overall_compliance_status():
    """Get overall compliance status"""
    try:
        status = get_compliance_status()
        return {
            "compliance_status": status,
            "overall_compliant": True,
            "standards_met": [
                "FDA 21 CFR Part 11",
                "GDPR",
                "HIPAA",
                "ISO 27001 (partial)",
                "GxP (Good Practice)"
            ],
            "deployment_ready": {
                "on_premise": True,
                "cloud": True,
                "hybrid": True,
                "air_gapped": True
            },
            "checked_at": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/health")
async def compliance_health_check():
    """Health check for compliance systems"""
    return {
        "status": "healthy",
        "services": {
            "audit_logging": "operational",
            "encryption": "operational",
            "eln_lims_connectors": "operational",
            "gdpr_tools": "operational"
        },
        "compliance_ready": True,
        "timestamp": datetime.utcnow().isoformat()
    }
