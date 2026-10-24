$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
$out = Join-Path $PSScriptRoot 'evidence-lab'
$fixtures = Join-Path $repo 'bioscribe-ai\public\evidence-lab'
New-Item -ItemType Directory -Path $out -Force | Out-Null
$python = Join-Path $repo '.phase3-venv\Scripts\python.exe'
$results = @()
Push-Location (Join-Path $repo 'backend')
try {
    foreach ($case in @('reference','challenge')) {
        $windowsOutput = Join-Path $out ($case + '-windows-replay.json')
        & $python -m provenance_lab replay (Join-Path $fixtures ($case + '-run.json')) --output $windowsOutput
        if ($LASTEXITCODE -ne 0) { throw "Windows replay failed: $case" }
        docker run --rm --network none --read-only --cap-drop ALL --security-opt no-new-privileges --memory 1g --cpus 2 --tmpfs /tmp --mount "type=bind,source=$fixtures,target=/fixtures,readonly" --mount "type=bind,source=$out,target=/out" bioscribe-hm01:1.0 python -m provenance_lab replay "/fixtures/$case-run.json" --output "/out/$case-linux-replay.json"
        if ($LASTEXITCODE -ne 0) { throw "Linux replay failed: $case" }
        $windows = Get-Content -Raw -LiteralPath $windowsOutput | ConvertFrom-Json
        $linux = Get-Content -Raw -LiteralPath (Join-Path $out ($case + '-linux-replay.json')) | ConvertFrom-Json
        if ($windows.actual_sha256 -ne $linux.actual_sha256) { throw 'Cross-environment result mismatch' }
        $results += @{case=$case; windows=$windows; linux=$linux; match=$true}
    }
    $image = docker image inspect bioscribe-hm01:1.0 --format '{{.Id}}'
    @{status='passed'; environments=@('Windows x86_64 CPython 3.11.9','Linux x86_64 Docker CPython 3.11.9'); scope='Two operating-system environments on one physical host; not a universal any-machine guarantee'; linux_image=$image; network='Linux --network none; both CLI processes deny socket connections'; comparison='Exact SHA-256 of canonical scientific payload at declared 8-decimal reporting precision'; results=$results} | ConvertTo-Json -Depth 8 | Set-Content -Encoding UTF8 -LiteralPath (Join-Path $out 'portability.json')
} finally { Pop-Location }
