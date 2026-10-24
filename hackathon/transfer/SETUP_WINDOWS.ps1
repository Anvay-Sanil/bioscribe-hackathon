param([switch]$Start)
$ErrorActionPreference = 'Stop'
$bundleRoot = $PSScriptRoot
$repo = Join-Path $bundleRoot 'source'
if (!(Test-Path -LiteralPath (Join-Path $repo 'backend/requirements-phase3.lock'))) {
    throw 'Extract the complete transfer ZIP first; run SETUP_WINDOWS.ps1 from its top-level folder.'
}
if (Get-Command py -ErrorAction SilentlyContinue) {
    $pythonCommand = (Get-Command py).Source
    $pythonPrefix = @('-3.11')
} elseif (Get-Command python -ErrorAction SilentlyContinue) {
    $pythonCommand = (Get-Command python).Source
    $pythonPrefix = @()
} else {
    throw 'Install Python 3.11 (recorded host: 3.11.9), then rerun this script.'
}
& $pythonCommand @pythonPrefix -c 'import sys; raise SystemExit(0 if sys.version_info[:2] == (3,11) else 2)'
if ($LASTEXITCODE -ne 0) { throw 'Python 3.11 is required by the recorded molecular engine.' }
foreach ($tool in @('node','npm.cmd')) {
    if (!(Get-Command $tool -ErrorAction SilentlyContinue)) { throw 'Install Node.js/npm first. Recorded host: Node 22.20.0, npm 10.9.3.' }
}
& $pythonCommand @pythonPrefix -B (Join-Path $bundleRoot 'VERIFY_TRANSFER.py')
if ($LASTEXITCODE -ne 0) { throw 'Transfer verification failed; obtain a fresh archive.' }
$venvPython = Join-Path $repo '.phase3-venv/Scripts/python.exe'
if (!(Test-Path -LiteralPath $venvPython)) {
    & $pythonCommand @pythonPrefix -m venv (Join-Path $repo '.phase3-venv')
    if ($LASTEXITCODE -ne 0) { throw 'Virtual environment creation failed.' }
}
& $venvPython -m pip install --require-hashes --only-binary=:all: -r (Join-Path $repo 'backend/requirements-phase3-install.lock')
if ($LASTEXITCODE -ne 0) { throw 'Locked Python dependency installation failed; internet/package index access is needed.' }
& $venvPython -m pip check
if ($LASTEXITCODE -ne 0) { throw 'Python dependency consistency check failed.' }
Push-Location (Join-Path $repo 'bioscribe-ai')
try {
    & npm.cmd ci
    if ($LASTEXITCODE -ne 0) { throw 'Locked frontend installation failed; internet/package registry access is needed.' }
} finally { Pop-Location }
Write-Host 'Dependencies installed. Run the local demo from source/hackathon/start-demo.ps1.'
Write-Host 'Fresh private credentials are provisioned on first start. Source runtime data was not transferred.'
if ($Start) {
    & (Join-Path $repo 'hackathon/start-demo.ps1') -Verify
    if (!$?) { throw 'Startup verification failed; read the local logs and do not claim a successful rehearsal.' }
}
