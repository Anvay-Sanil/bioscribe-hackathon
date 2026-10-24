param([switch]$Verify)
$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
$runtime = Join-Path $PSScriptRoot '.local'
$python = Join-Path $repo '.phase3-venv\Scripts\python.exe'
$frontend = Join-Path $repo 'bioscribe-ai'
if (!(Test-Path -LiteralPath $python)) { throw 'Install the locked Phase 3 Python environment first. See docs/PHASE_3_IMPLEMENTATION.md.' }
if (!(Test-Path -LiteralPath (Join-Path $frontend 'node_modules\next\dist\bin\next'))) { throw 'Run npm ci in bioscribe-ai first.' }
New-Item -ItemType Directory -Path $runtime -Force | Out-Null
$auth = Join-Path $runtime 'principals.json'
$token = Join-Path $runtime 'demo-token.txt'
if (!(Test-Path -LiteralPath $auth) -and !(Test-Path -LiteralPath $token)) {
    Push-Location (Join-Path $repo 'backend')
    try { & $python -m bioscribe.auth --auth-file $auth --token-file $token --tenant hackathon-local --subject presenter; if ($LASTEXITCODE -ne 0) { throw 'Credential provisioning failed.' } }
    finally { Pop-Location }
}
if (!(Test-Path -LiteralPath $auth) -or !(Test-Path -LiteralPath $token)) { throw 'Incomplete demo credentials. Restore the missing local file; existing files are never overwritten.' }
$oldDatabase = $env:BIOSCRIBE_DATABASE
$oldAuth = $env:BIOSCRIBE_AUTH_FILE
$oldOrigin = $env:BIOSCRIBE_ORIGIN
try {
    $env:BIOSCRIBE_DATABASE = Join-Path $runtime 'runs.sqlite3'
    $env:BIOSCRIBE_AUTH_FILE = $auth
    $env:BIOSCRIBE_ORIGIN = 'http://localhost:3000'
    $apiListener = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue
    if (!$apiListener) {
        $api = Start-Process -FilePath $python -ArgumentList '-m uvicorn bioscribe.api:app --host 127.0.0.1 --port 8000 --no-access-log' -WorkingDirectory (Join-Path $repo 'backend') -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $runtime 'api.stdout.log') -RedirectStandardError (Join-Path $runtime 'api.stderr.log')
        $worker = Start-Process -FilePath $python -ArgumentList '-m bioscribe.worker' -WorkingDirectory (Join-Path $repo 'backend') -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $runtime 'worker.stdout.log') -RedirectStandardError (Join-Path $runtime 'worker.stderr.log')
        @{api_pid=$api.Id; worker_pid=$worker.Id; started_utc=[DateTime]::UtcNow.ToString('o')} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $runtime 'processes.json')
    } else {
        Write-Host 'Port 8000 is already in use. Existing services were preserved; use their provisioned token if they belong to another workspace.'
    }
    $webListener = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
    if (!$webListener) {
        $node = (Get-Command node).Source
        $next = Join-Path $frontend 'node_modules\next\dist\bin\next'
        Start-Process -FilePath $node -ArgumentList @(('"' + $next + '"'), 'dev', '--turbopack', '--hostname', '127.0.0.1') -WorkingDirectory $frontend -WindowStyle Hidden -RedirectStandardOutput (Join-Path $runtime 'web.stdout.log') -RedirectStandardError (Join-Path $runtime 'web.stderr.log') | Out-Null
    }
} finally {
    $env:BIOSCRIBE_DATABASE = $oldDatabase
    $env:BIOSCRIBE_AUTH_FILE = $oldAuth
    $env:BIOSCRIBE_ORIGIN = $oldOrigin
}
Write-Host 'Open http://localhost:3000/evidence. Recorded examples need no token; /molecules remains available.'
Write-Host ('For live runs, choose Load token file and select ' + $token)
Write-Host 'Public, non-sensitive inputs only. Startup may take a few seconds; check /health/ready before the live rehearsal.'
if ($Verify) {
    $ready = $false
    for ($attempt = 0; $attempt -lt 20; $attempt++) {
        try { $health = Invoke-RestMethod -Uri 'http://127.0.0.1:8000/health/ready' -TimeoutSec 2; if ($health.status -eq 'ready') { $ready = $true; break } } catch { }
        Start-Sleep -Milliseconds 500
    }
    if (!$ready) { throw 'Local API or worker is not ready. Check the .local logs. Existing processes were not replaced.' }
    & $python (Join-Path $PSScriptRoot 'preflight.py')
    if ($LASTEXITCODE -ne 0) { throw 'Live rehearsal failed. See the sanitized preflight message.' }
}
