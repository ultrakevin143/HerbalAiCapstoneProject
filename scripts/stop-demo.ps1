$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$pidFile = Join-Path $projectRoot '.demo-pids.json'

if (-not (Test-Path -LiteralPath $pidFile)) {
  Write-Host 'No demo PID file was found.'
  exit 0
}

$demo = Get-Content -LiteralPath $pidFile | ConvertFrom-Json
foreach ($processId in @($demo.backendPid, $demo.frontendPid)) {
  if ($processId -and (Get-Process -Id $processId -ErrorAction SilentlyContinue)) {
    Stop-Process -Id $processId -Force
  }
}

Remove-Item -LiteralPath $pidFile
Write-Host 'Production demo processes stopped.'
