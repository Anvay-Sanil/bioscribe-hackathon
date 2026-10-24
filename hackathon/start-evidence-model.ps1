$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
$local = Join-Path $PSScriptRoot '.local/evidence-model'
$card = Get-Content -Raw -LiteralPath (Join-Path $repo 'backend/evidence_assistant/model_card.json') | ConvertFrom-Json
$model = Join-Path $local $card.file
$server = Join-Path $local 'runtime/llama-server.exe'
if (!(Test-Path -LiteralPath $server) -or !(Test-Path -LiteralPath $model)) { throw 'Run hackathon/prepare_evidence_model.py first.' }
if ((Get-FileHash -Algorithm SHA256 -LiteralPath $model).Hash.ToLowerInvariant() -ne $card.sha256) { throw 'Model hash does not match the pinned 4B weights.' }
if (Get-NetTCPConnection -LocalPort 8091 -State Listen -ErrorAction SilentlyContinue) { throw 'Port 8091 is already occupied; existing service was preserved.' }
$keyFile = Join-Path $local 'api-key.txt'
if (!(Test-Path -LiteralPath $keyFile)) {
    $keyBytes = New-Object byte[] 32
    [System.Security.Cryptography.RandomNumberGenerator]::Fill($keyBytes)
    [Convert]::ToBase64String($keyBytes) | Set-Content -LiteralPath $keyFile -Encoding utf8
}
$modelArgs = @('-m',('"'+$model+'"'),'--host','127.0.0.1','--port','8091','--alias','bioscribe-qwen3-4b','-c','4096','-np','1','-t','4','-ngl','0','--jinja','--api-key-file',('"'+$keyFile+'"'),'--no-webui','--cors-origins','http://localhost:3000','--no-cors-credentials')
$process = Start-Process -FilePath $server -ArgumentList $modelArgs -WindowStyle Hidden -PassThru -WorkingDirectory $local -RedirectStandardOutput (Join-Path $local 'server.stdout.log') -RedirectStandardError (Join-Path $local 'server.stderr.log')
@{pid=$process.Id;started_utc=[DateTime]::UtcNow.ToString('o');model_sha256=$card.sha256;loopback_port=8091} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $local 'server-process.json')
Write-Host 'Local 4B model process started on loopback port 8091. Wait for /health to report ready before requesting suggestions or baseline evaluation.'
