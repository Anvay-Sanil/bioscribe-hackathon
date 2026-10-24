"""Provisioned machine/user bearer credentials. No public sign-up or default secret."""
import hashlib
import hmac
import json
from pathlib import Path
import secrets


def authenticate(path: Path,authorization: str | None):
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token=authorization[7:]
    if not 32 <= len(token) <= 256:
        return None
    try:
        principals=json.loads(path.read_text(encoding="utf-8"))
    except (OSError,ValueError):
        return None
    token_hash=hashlib.sha256(token.encode()).hexdigest()
    for record in principals:
        if hmac.compare_digest(token_hash,record["token_sha256"]) and record.get("enabled") is True:
            return record["tenant"],record["subject"]
    return None


def provision(auth_file: Path,token_file: Path,tenant: str,subject: str):
    if auth_file.exists() or token_file.exists():
        raise ValueError("refusing_to_overwrite_credentials")
    token=secrets.token_urlsafe(48)
    auth_file.parent.mkdir(parents=True,exist_ok=True)
    token_file.parent.mkdir(parents=True,exist_ok=True)
    with token_file.open("x",encoding="utf-8") as stream:
        stream.write(token)
    with auth_file.open("x",encoding="utf-8") as stream:
        json.dump([{"tenant":tenant,"subject":subject,"token_sha256":hashlib.sha256(token.encode()).hexdigest(),"enabled":True}],stream)
    return token_file


if __name__ == "__main__":
    import argparse
    parser=argparse.ArgumentParser()
    parser.add_argument("--auth-file",type=Path,required=True)
    parser.add_argument("--token-file",type=Path,required=True)
    parser.add_argument("--tenant",required=True)
    parser.add_argument("--subject",required=True)
    args=parser.parse_args()
    print(provision(args.auth_file,args.token_file,args.tenant,args.subject))
