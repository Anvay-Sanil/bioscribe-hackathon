"""Independent signed checkpoint protocol; NOT enabled as a deployed trust boundary.

The verifier is useful only when the latest checkpoint is obtained from an
independently protected live service. A supplied/cache-only receipt is insufficient.
"""
import base64
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
from .identity import canonical, digest


class IntegrityError(ValueError):
    pass


def chain(events):
    head="genesis"
    for sequence,event in enumerate(events,1):
        if event["sequence"]!=sequence:
            raise IntegrityError("sequence_mismatch")
        head=digest(head+":"+canonical(event))
    return head


def verify(events,log_id,fetch_latest,trusted_keys):
    try:
        receipt=fetch_latest(log_id)
    except Exception:
        return {"status":"integrity_unverified","reason":"trusted_checkpoint_unavailable"}
    try:
        checkpoint=receipt["checkpoint"]
        key=trusted_keys[checkpoint["key_id"]]
        Ed25519PublicKey.from_public_bytes(key).verify(base64.b64decode(receipt["signature"],validate=True),canonical(checkpoint).encode())
        if checkpoint["log_id"]!=log_id or any(e["log_id"]!=log_id for e in events):
            raise IntegrityError("log_binding")
        if checkpoint["count"]!=len(events) or checkpoint["head"]!=chain(events):
            raise IntegrityError("history_mismatch")
        return {"status":"verified_against_trusted_checkpoint","count":len(events),"authorship":"requires_separate_authenticated_event_source"}
    except Exception:
        return {"status":"integrity_failed","reason":"checkpoint_or_history_mismatch"}
