Param(
  [string]$AppDir = "app",
  [string]$OutDir = "dist_electron_new",
  [switch]$RunSilentInstall
)

Write-Host "CI: Starting packaging and validation pipeline" -ForegroundColor Cyan

# Attempt to locate Node and set PATH so npm/npx resolve
function Find-NodeCI {
  $workspaceNode = Join-Path (Resolve-Path ".").Path "node20\node.exe"
  $candidates = @(
    $workspaceNode,
    "$Env:ProgramFiles\nodejs\node.exe",
    "$Env:ProgramFiles(x86)\nodejs\node.exe",
    "$Env:LocalAppData\Programs\nodejs\node.exe",
    "$Env:LocalAppData\nodejs\node.exe",
    "C:\\Program Files\\nodejs\\node.exe",
    "C:\\Program Files (x86)\\nodejs\\node.exe"
  )
  foreach ($c in $candidates) { if ($c -and (Test-Path $c)) { return $c } }
  return $null
}

$node = Find-NodeCI
if ($node) {
  $nodeDir = Split-Path $node
  $env:Path = "$nodeDir;$env:Path"
}

Push-Location $AppDir
try {
  # Clean previous outputs if scripts exist
  if (Test-Path "scripts\clean.ps1") {
    Write-Host "CI: Running clean script" -ForegroundColor Cyan
    & powershell -ExecutionPolicy Bypass -File "scripts\clean.ps1"
  }

  # Export web build
  Write-Host "CI: Exporting web build (expo export:web)" -ForegroundColor Cyan
  npm run export:web --if-present

  # Build Electron NSIS installer with asar disabled
  Write-Host "CI: Running electron-builder (NSIS, asar=false)" -ForegroundColor Cyan
  npx electron-builder -w nsis -c.asar=false -o $OutDir

  # Validate installer presence
  $exe = Get-ChildItem -Path $OutDir -Filter "*Setup*.exe" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($exe) {
    Write-Host "CI: Found installer -> $($exe.FullName)" -ForegroundColor Green
  } else {
    Write-Warning "CI: Installer not found in $OutDir. Check electron-builder logs."
  }

  # Optional silent install
  if ($RunSilentInstall.IsPresent -and $exe) {
    Write-Host "CI: Running optional silent install" -ForegroundColor Cyan
    $desktop = [Environment]::GetFolderPath('Desktop')
    $dest = Join-Path $desktop $exe.Name
    Copy-Item -Path $exe.FullName -Destination $dest -Force
    Start-Process -FilePath $dest -ArgumentList "/S" -Verb RunAs -Wait
  }

  # Basic UI health-check if local static server is running
  try {
    $resp = Invoke-WebRequest -Uri "http://localhost:8080/" -UseBasicParsing -TimeoutSec 5
    if ($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 400) {
      Write-Host "CI: UI health-check passed (HTTP $($resp.StatusCode))" -ForegroundColor Green
    } else {
      Write-Warning "CI: UI health-check returned HTTP $($resp.StatusCode)"
    }
  } catch {
    Write-Warning "CI: UI health-check failed: $($_.Exception.Message)"
  }

  Write-Host "CI: Pipeline completed" -ForegroundColor Cyan
} finally {
  Pop-Location
}