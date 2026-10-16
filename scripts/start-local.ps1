param(
  [string[]]$EmailTestRecipient = @()
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$logRoot = Join-Path $projectRoot '.demo-logs'
$pidFile = Join-Path $projectRoot '.local-pids.json'
if (Test-Path -LiteralPath $pidFile) { throw 'Local servers are already recorded. Run scripts\stop-local.ps1 first.' }
foreach ($port in 3000, 5000) {
  if (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue) {
    throw "Port $port is already in use. Stop the existing service before starting local development."
  }
}
foreach ($recipient in $EmailTestRecipient) {
  $address = [Net.Mail.MailAddress]::new($recipient)
  if ($address.Address -ne $recipient -or $recipient -match '[,;\r\n]') { throw 'Provide plain email addresses for the test allowlist.' }
}
New-Item -ItemType Directory -Path $logRoot -Force | Out-Null
$overrides = @{
  NODE_ENV = 'development'
  PORT = '5000'
  FRONTEND_URL = 'http://localhost:3000'
  BACKEND_URL = 'http://localhost:5000'
  GOOGLE_REDIRECT_URI = 'http://localhost:5000/api/auth/google/callback'
  NEXT_PUBLIC_API_URL = 'http://localhost:5000/api'
  NEXT_PUBLIC_SOCKET_URL = 'http://localhost:5000'
  # Open database connections only when needed; let idle connections close.
  DB_POOL_MIN = '0'
  DB_POOL_MAX = '3'
  DB_POOL_IDLE_TIMEOUT_MS = '15000'
  DB_POOL_METRICS_INTERVAL_MS = '0'
  HERB_CACHE_TTL_MS = '300000'
  EMAIL_DELIVERY_MODE = $(if ($EmailTestRecipient.Count) { 'allowlist' } else { 'log' })
  EMAIL_ALLOWED_RECIPIENTS = ($EmailTestRecipient -join ',')
}
$previous = @{}
$started = @()
try {
  foreach ($entry in $overrides.GetEnumerator()) {
    $previous[$entry.Key] = [Environment]::GetEnvironmentVariable($entry.Key, 'Process')
    [Environment]::SetEnvironmentVariable($entry.Key, $entry.Value, 'Process')
  }
  $backend = Start-Process -FilePath 'node.exe' -ArgumentList @('node_modules/tsx/dist/cli.mjs', 'watch', 'src/index.ts') -WorkingDirectory (Join-Path $projectRoot 'herbalaibackend') -WindowStyle Hidden -RedirectStandardOutput (Join-Path $logRoot 'local-backend.out.log') -RedirectStandardError (Join-Path $logRoot 'local-backend.err.log') -PassThru
  $started += $backend
  $frontend = Start-Process -FilePath 'node.exe' -ArgumentList @('node_modules/next/dist/bin/next', 'dev', '--port', '3000') -WorkingDirectory (Join-Path $projectRoot 'herbalaifrontend') -WindowStyle Hidden -RedirectStandardOutput (Join-Path $logRoot 'local-frontend.out.log') -RedirectStandardError (Join-Path $logRoot 'local-frontend.err.log') -PassThru
  $started += $frontend
  @{
    processes = @($started | ForEach-Object { @{ id = $_.Id; startedAtUtc = $_.StartTime.ToUniversalTime().ToString('o') } })
  } | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $pidFile
} catch {
  if (Test-Path -LiteralPath $pidFile) { & (Join-Path $PSScriptRoot 'stop-local.ps1') }
  else { foreach ($child in $started) { Stop-Process -Id $child.Id -Force -ErrorAction SilentlyContinue } }
  throw
} finally {
  foreach ($key in $previous.Keys) { [Environment]::SetEnvironmentVariable($key, $previous[$key], 'Process') }
}

$ready = $false
for ($attempt = 0; $attempt -lt 40; $attempt++) {
  $backend.Refresh()
  $frontend.Refresh()
  if ($backend.HasExited -or $frontend.HasExited) { break }
  try {
    $health = Invoke-RestMethod -Uri 'http://localhost:5000/api/health' -TimeoutSec 2
    $web = Invoke-WebRequest -Uri 'http://localhost:3000' -UseBasicParsing -TimeoutSec 3
    if ($health.status -eq 'success' -and $web.StatusCode -eq 200 -and $web.Content -match '<title>Herbal-Ai') { $ready = $true; break }
  } catch { Start-Sleep -Milliseconds 500 }
}
if (-not $ready) {
  & (Join-Path $PSScriptRoot 'stop-local.ps1')
  throw 'Local startup failed. Inspect .demo-logs/local-*.log.'
}
Write-Host 'Local development ready: http://localhost:3000 (API: http://localhost:5000/api)'
Write-Host 'Frontend hot reload and backend watch mode are enabled.'
Write-Host 'Database: at most 3 pooled connections; idle connections close after 15 seconds; herb reads are cached for 5 minutes.'
Write-Host $(if ($EmailTestRecipient.Count) { 'Email delivery is limited to the explicit test allowlist.' } else { 'Email delivery uses log mode. Use -EmailTestRecipient to test a real inbox.' })
Write-Host 'Stop with .\scripts\stop-local.ps1 when debugging is finished.'
