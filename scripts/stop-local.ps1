$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$pidFile = Join-Path $projectRoot '.local-pids.json'
if (-not (Test-Path -LiteralPath $pidFile)) { Write-Host 'No local development PID file was found.'; return }
$record = Get-Content -LiteralPath $pidFile | ConvertFrom-Json
$snapshot = @(Get-CimInstance Win32_Process)
function Stop-LocalTree {
  param([int]$TargetId)
  foreach ($childProcess in @($snapshot | Where-Object ParentProcessId -EQ $TargetId)) {
    $stillRunning = Get-Process -Id $childProcess.ProcessId -ErrorAction SilentlyContinue
    if ($stillRunning -and [math]::Abs(($stillRunning.StartTime.ToUniversalTime() - $childProcess.CreationDate.ToUniversalTime()).TotalMilliseconds) -lt 1) {
      Stop-LocalTree -TargetId $childProcess.ProcessId
    }
  }
  Stop-Process -Id $TargetId -Force -ErrorAction SilentlyContinue
}
foreach ($entry in $record.processes) {
  $running = Get-Process -Id $entry.id -ErrorAction SilentlyContinue
  if (-not $running) { continue }
  $recordedStart = ([DateTimeOffset]$entry.startedAtUtc).UtcDateTime
  if ($running.StartTime.ToUniversalTime() -ne $recordedStart) {
    throw "Process ID $($entry.id) was reused. Refusing to stop an unrelated process."
  }
  Stop-LocalTree -TargetId $entry.id
}
Remove-Item -LiteralPath $pidFile
Write-Host 'Local development servers and their watch processes stopped.'
