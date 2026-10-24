# Locked educational runtime; see hackathon/evidence-lab/ for executed checks.
FROM python:3.11.9-slim@sha256:8fb099199b9f2d70342674bd9dbccd3ed03a258f26bbd1d556822c6dfc60c317
WORKDIR /app/backend
COPY backend/requirements-phase3.lock /app/backend/requirements-phase3.lock
COPY backend/requirements-phase3-install.lock /app/backend/requirements-phase3-install.lock
RUN pip install --no-cache-dir --require-hashes --only-binary=:all: -r requirements-phase3-install.lock
COPY backend/molecular_core.py backend/contract_fields.py /app/backend/
COPY backend/bioscribe /app/backend/bioscribe
COPY backend/provenance_lab /app/backend/provenance_lab
COPY backend/provenance_lab_legacy_v1 /app/backend/provenance_lab_legacy_v1
COPY backend/evidence_assistant /app/backend/evidence_assistant
RUN useradd --create-home bioscribe && mkdir -p /app/backend/data && chown -R bioscribe:bioscribe /app/backend/data
USER bioscribe
EXPOSE 8000
CMD ["python", "-m", "uvicorn", "bioscribe.api:app", "--host", "0.0.0.0", "--port", "8000", "--no-access-log"]
