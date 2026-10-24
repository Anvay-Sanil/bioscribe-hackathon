param([int]$Port = 8000)
$ErrorActionPreference = 'Stop'
$phase3Python = Join-Path $PSScriptRoot '.phase3-venv/Scripts/python.exe'
if (-not (Test-Path -LiteralPath $phase3Python)) { throw 'Create .phase3-venv and install backend/requirements-phase3.lock first.' }
Push-Location (Join-Path $PSScriptRoot 'backend')
try { & $phase3Python -m uvicorn bioscribe.api:app --host 127.0.0.1 --port $Port --no-access-log }
finally { Pop-Location }
