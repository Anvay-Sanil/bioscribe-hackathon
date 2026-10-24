$ErrorActionPreference = 'Stop'
$phase3Python = Join-Path $PSScriptRoot '.phase3-venv/Scripts/python.exe'
Push-Location (Join-Path $PSScriptRoot 'backend')
try { & $phase3Python -m bioscribe.worker }
finally { Pop-Location }
