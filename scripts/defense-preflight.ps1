param(
  [switch]$RunAutomatedChecks,
  [switch]$RunBrowserChecks
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$failures = [System.Collections.Generic.List[string]]::new()
$warnings = [System.Collections.Generic.List[string]]::new()

function Write-Check {
  param([string]$Label, [bool]$Passed, [string]$Detail)
  $status = if ($Passed) { 'PASS' } else { 'FAIL' }
  $color = if ($Passed) { 'Green' } else { 'Red' }
  Write-Host ("[{0}] {1}: {2}" -f $status, $Label, $Detail) -ForegroundColor $color
  if (-not $Passed) { $failures.Add("${Label}: ${Detail}") }
}

function Write-PreflightWarning {
  param([string]$Label, [string]$Detail)
  Write-Host ("[WARN] {0}: {1}" -f $Label, $Detail) -ForegroundColor Yellow
  $warnings.Add("${Label}: ${Detail}")
}

Write-Host 'Herbal AI defense preflight' -ForegroundColor Cyan
Write-Host "Project: $projectRoot"

$requiredFiles = @(
  'Herbal_AI_Capstone_Defense_v1.pptx',
  'output\pdf\Herbal_AI_Capstone_Defense_v1.pdf',
  'DEFENSE_DEMO_SCRIPT.md',
  'Docs\LOCAL_PRESENTATION_RUNBOOK.md',
  'Herbal_AI_SRS_v3.docx',
  'Herbal_AI_SPMP_v3.docx',
  'Herbal_AI_SDD_v2.docx',
  'Herbal_AI_STD_v2.docx'
)

foreach ($relativePath in $requiredFiles) {
  $absolutePath = Join-Path $projectRoot $relativePath
  Write-Check "Artifact $relativePath" (Test-Path -LiteralPath $absolutePath -PathType Leaf) 'present'
}

$backendEnv = Join-Path $projectRoot 'herbalaibackend\.env'
$frontendEnv = Join-Path $projectRoot 'herbalaifrontend\.env.local'
Write-Check 'Backend environment file' (Test-Path -LiteralPath $backendEnv -PathType Leaf) 'configured file exists; values were not displayed'
Write-Check 'Frontend environment file' (Test-Path -LiteralPath $frontendEnv -PathType Leaf) 'configured file exists; values were not displayed'

$commands = @(
  @{ Name = 'Node.js'; Command = 'node.exe' },
  @{ Name = 'npm'; Command = 'npm.cmd' }
)
foreach ($item in $commands) {
  $resolved = if ([System.IO.Path]::IsPathRooted($item.Command)) {
    Test-Path -LiteralPath $item.Command -PathType Leaf
  } else {
    $null -ne (Get-Command $item.Command -ErrorAction SilentlyContinue)
  }
  Write-Check $item.Name $resolved 'available'
}
$chromeCandidates = @(
  'C:\Program Files\Google\Chrome\Application\chrome.exe',
  'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe',
  (Join-Path $env:LOCALAPPDATA 'Google\Chrome\Application\chrome.exe')
)
$chromePath = $chromeCandidates | Where-Object { Test-Path -LiteralPath $_ -PathType Leaf } | Select-Object -First 1
Write-Check 'Google Chrome' ($null -ne $chromePath) $(if ($chromePath) { "available at $chromePath" } else { 'not found in supported installation paths' })

$pptPath = Join-Path $projectRoot 'Herbal_AI_Capstone_Defense_v1.pptx'
if (Test-Path -LiteralPath $pptPath -PathType Leaf) {
  $powerPoint = $null
  $presentation = $null
  try {
    $powerPoint = New-Object -ComObject PowerPoint.Application
    $presentation = $powerPoint.Presentations.Open($pptPath, $true, $false, $false)
    Write-Check 'PowerPoint deck' ($presentation.Slides.Count -eq 15) "$($presentation.Slides.Count) slides opened successfully"
  } catch {
    Write-Check 'PowerPoint deck' $false "could not be opened: $($_.Exception.Message)"
  } finally {
    if ($presentation) { $presentation.Close(); [System.Runtime.InteropServices.Marshal]::ReleaseComObject($presentation) | Out-Null }
    if ($powerPoint) { $powerPoint.Quit(); [System.Runtime.InteropServices.Marshal]::ReleaseComObject($powerPoint) | Out-Null }
    [GC]::Collect(); [GC]::WaitForPendingFinalizers()
  }
}

foreach ($port in 3000, 5000) {
  $listener = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
  if ($listener) {
    try {
      if ($port -eq 3000) {
        $response = Invoke-WebRequest -Uri 'http://localhost:3000' -UseBasicParsing -TimeoutSec 3
        $healthy = $response.StatusCode -eq 200 -and $response.Content -match '<title>Herbal AI'
      } else {
        $response = Invoke-RestMethod -Uri 'http://localhost:5000/api/health' -TimeoutSec 3
        $healthy = $response.status -eq 'success'
      }
      Write-Check "Port $port" $healthy 'Herbal AI service is listening and healthy'
    } catch {
      Write-Check "Port $port" $false 'occupied, but the expected Herbal AI health check failed'
    }
  } else {
    Write-PreflightWarning "Port $port" 'free; start the production demo before browser rehearsal'
  }
}

$backendBuild = Join-Path $projectRoot 'herbalaibackend\dist\index.js'
$frontendBuild = Join-Path $projectRoot 'herbalaifrontend\.next\BUILD_ID'
Write-Check 'Backend production build' (Test-Path -LiteralPath $backendBuild -PathType Leaf) 'dist/index.js is present'
Write-Check 'Frontend production build' (Test-Path -LiteralPath $frontendBuild -PathType Leaf) '.next/BUILD_ID is present'

$gitStatus = & git -C $projectRoot status --porcelain
if ($LASTEXITCODE -ne 0) {
  Write-PreflightWarning 'Git state' 'could not read repository status'
} elseif ($gitStatus) {
  Write-PreflightWarning 'Git state' 'working tree has uncommitted changes; review them before presenting'
} else {
  Write-Host '[PASS] Git state: working tree is clean' -ForegroundColor Green
}

if ($RunAutomatedChecks) {
  Write-Host 'Running backend tests and production builds...' -ForegroundColor Cyan
  & npm.cmd --prefix (Join-Path $projectRoot 'herbalaibackend') test -- --run
  if ($LASTEXITCODE -ne 0) { $failures.Add('Backend automated tests failed') }
  & npm.cmd --prefix (Join-Path $projectRoot 'herbalaibackend') run build
  if ($LASTEXITCODE -ne 0) { $failures.Add('Backend production build failed') }
  & npm.cmd --prefix (Join-Path $projectRoot 'herbalaifrontend') run lint
  if ($LASTEXITCODE -ne 0) { $failures.Add('Frontend lint failed') }
  & npm.cmd --prefix (Join-Path $projectRoot 'herbalaifrontend') run build
  if ($LASTEXITCODE -ne 0) { $failures.Add('Frontend production build failed') }
}

if ($RunBrowserChecks) {
  $frontendListener = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
  $backendListener = Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue
  if (-not $frontendListener -or -not $backendListener) {
    $failures.Add('Browser checks requested, but both local services are not running')
  } else {
    & node.exe (Join-Path $projectRoot 'scripts\run-local-rehearsal.mjs')
    if ($LASTEXITCODE -ne 0) { $failures.Add('Read-only browser rehearsal failed') }
  }
}

Write-Host ''
Write-Host ("Preflight summary: {0} failure(s), {1} warning(s)." -f $failures.Count, $warnings.Count) -ForegroundColor $(if ($failures.Count -eq 0) { 'Green' } else { 'Red' })
if ($warnings.Count -gt 0) {
  Write-Host 'Warnings are expected when the local demo is intentionally stopped.' -ForegroundColor Yellow
}
if ($failures.Count -gt 0) {
  $failures | ForEach-Object { Write-Host " - $_" -ForegroundColor Red }
  exit 1
}
