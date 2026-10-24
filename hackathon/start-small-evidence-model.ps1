$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
$local = Join-Path $PSScriptRoot '.local/evidence-small'
$card = Get-Content -Raw -LiteralPath (Join-Path $repo 'backend/evidence_assistant/model_card_small.json') | ConvertFrom-Json
$model = Join-Path $local $card.file
$runtime = Join-Path $PSScriptRoot '.local/evidence-model/runtime'
$receipt = Get-Content -Raw -LiteralPath (Join-Path $local 'installation.json') | ConvertFrom-Json
if ((Get-FileHash -Algorithm SHA256 -LiteralPath $model).Hash.ToLowerInvariant() -ne $card.sha256) { throw 'Model bytes do not match.' }
if ((Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $PSScriptRoot '.local/evidence-model/runtime.zip')).Hash.ToLowerInvariant() -ne $receipt.runtime_archive_sha256) { throw 'Runtime archive bytes do not match.' }
if (Get-NetTCPConnection -LocalPort 8092 -State Listen -ErrorAction SilentlyContinue) { throw 'Port 8092 is occupied; existing service preserved.' }
$modelArgs = @('-m',('"'+$model+'"'),'--host','127.0.0.1','--port','8092','--alias',$card.local_alias,'-c','8192','-np','1','-t','4','-ngl','0','--api-key-file',('"'+(Join-Path $local 'api-key.txt')+'"'),'--no-webui','--cors-origins','http://localhost:3000','--no-cors-credentials')
$process = Start-Process -FilePath (Join-Path $runtime 'llama-server.exe') -ArgumentList $modelArgs -WindowStyle Hidden -PassThru -WorkingDirectory $local -RedirectStandardOutput (Join-Path $local 'server.stdout.log') -RedirectStandardError (Join-Path $local 'server.stderr.log')
@{pid=$process.Id;started_utc=[DateTime]::UtcNow.ToString('o');model_sha256=$card.sha256;loopback_port=8092} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $local 'server-process.json')
Write-Host 'Additional 0.5B local gateway started on loopback port 8092; historical 4B gateway preserved.'
