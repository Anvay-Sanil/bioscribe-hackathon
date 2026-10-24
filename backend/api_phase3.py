"""Supported entry point: python -m uvicorn bioscribe.api:app --host 127.0.0.1."""
from bioscribe.api import app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app,host="127.0.0.1",port=8000,access_log=False)
