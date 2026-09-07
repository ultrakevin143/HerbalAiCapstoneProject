param(
  [switch]$SkipBuild
)

$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$backendRoot = Join-Path $projectRoot 'herbalaibackend'
$frontendRoot = Join-Path $projectRoot 'herbalaifrontend'
$logRoot = Join-Path $projectRoot '.demo-logs'
$pidFile = Join-Path $projectRoot '.demo-pids.json'

if (Test-Path -LiteralPath $pidFile) {
  throw 'A demo PID file already exists. Run scripts\stop-demo.ps1 first.'
}

foreach ($port in 3000, 5000) {
  # Check IPv4 and IPv6 listeners; an IPv4-only bind can miss a Node server on ::.
  if (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue) {
    throw "Port $port is already in use. Stop the existing local service first."
  }
  $listener = [Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, $port)
  try { $listener.Start() } catch { throw "Port $port is already in use. Stop the existing local service first." } finally { $listener.Stop() }
}

New-Item -ItemType Directory -Force -Path $logRoot | Out-Null

if ($SkipBuild) {
  $backendEntry = Join-Path $backendRoot 'dist\index.js'
  $frontendBuild = Join-Path $frontendRoot '.next\BUILD_ID'
  if (-not (Test-Path -LiteralPath $backendEntry) -or -not (Test-Path -LiteralPath $frontendBuild)) {
    throw 'Production build artifacts are missing. Run the demo without -SkipBuild first.'
  }
  Write-Host 'Using existing verified production build artifacts.'
} else {
  Write-Host 'Building backend...'
  & npm.cmd --prefix $backendRoot run build
  if ($LASTEXITCODE -ne 0) { throw 'Backend build failed.' }

  Write-Host 'Building frontend...'
  & npm.cmd --prefix $frontendRoot run build
  if ($LASTEXITCODE -ne 0) { throw 'Frontend build failed.' }
}

$env:NODE_ENV = 'production'
if (-not $env:EMAIL_DELIVERY_MODE) {
  $env:EMAIL_DELIVERY_MODE = 'log'
}
$backend = Start-Process -FilePath 'node.exe' -ArgumentList @('dist/index.js') -WorkingDirectory $backendRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $logRoot 'backend.out.log') -RedirectStandardError (Join-Path $logRoot 'backend.err.log') -PassThru
$frontend = Start-Process -FilePath 'node.exe' -ArgumentList @('node_modules/next/dist/bin/next', 'start') -WorkingDirectory $frontendRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $logRoot 'frontend.out.log') -RedirectStandardError (Join-Path $logRoot 'frontend.err.log') -PassThru

@{ backendPid = $backend.Id; frontendPid = $frontend.Id } | ConvertTo-Json | Set-Content -LiteralPath $pidFile

$healthy = $false
# Remote database warm-up can intentionally delay backend readiness.
for ($attempt = 1; $attempt -le 30; $attempt++) {
  try {
    $backend.Refresh()
    $frontend.Refresh()
    if ($backend.HasExited -or $frontend.HasExited) { break }
    $api = Invoke-RestMethod -Uri 'http://localhost:5000/api/health' -TimeoutSec 2
    $web = Invoke-WebRequest -Uri 'http://localhost:3000' -UseBasicParsing -TimeoutSec 2
    if ($api.status -eq 'success' -and $web.StatusCode -eq 200 -and $web.Content -match '<title>Herbal AI') { $healthy = $true; break }
  } catch {
    Start-Sleep -Milliseconds 750
  }
}

if (-not $healthy) {
  Write-Warning 'The demo did not become healthy. Review .demo-logs and run scripts\stop-demo.ps1.'
  exit 1
}

Write-Host 'Production demo is ready at http://localhost:3000'
Write-Host 'Run scripts\stop-demo.ps1 when finished.'
