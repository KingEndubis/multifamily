Param(
  [string]$NodePath,
  [string]$AppDir = "app",
  [string]$OutDir = "dist_electron_new"
)

function Find-Node {
  param([string]$Explicit)
  if ($Explicit -and (Test-Path $Explicit)) { return $Explicit }
  $workspaceNode = Join-Path (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent) "node20\node.exe"
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

$node = Find-Node -Explicit $NodePath
if (-not $node) {
  Write-Error "Node.js not found. Please install Node.js or provide -NodePath and try again."
  exit 1
}

# Ensure npm and npx resolve using Node directory
$nodeDir = Split-Path $node
$env:Path = "$nodeDir;$env:Path"
$npm = Join-Path $nodeDir "npm.cmd"
if (-not (Test-Path $npm)) { $npm = "npm" }

Push-Location $AppDir
try {
  Write-Host "[1/4] Exporting web build via Expo..." -ForegroundColor Cyan
  & $npm run export:web --if-present 2>&1 | Tee-Object -Variable ExportLog

  Write-Host "[2/4] Building Electron NSIS installer (asar=false) to $OutDir..." -ForegroundColor Cyan
  & $npm exec electron-builder -- -w nsis -c.asar=false -o $OutDir 2>&1 | Tee-Object -Variable BuildLog

  $exe = Get-ChildItem -Path $OutDir -Filter "*Setup*.exe" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
  if (-not $exe) {
    Write-Warning "NSIS installer not found in $OutDir. Check BuildLog for details."
    exit 2
  }

  Write-Host "[3/4] Copying installer to Desktop..." -ForegroundColor Cyan
  $desktop = [Environment]::GetFolderPath('Desktop')
  $dest = Join-Path $desktop $exe.Name
  Copy-Item -Path $exe.FullName -Destination $dest -Force

  Write-Host "[4/4] Running silent install (/S)..." -ForegroundColor Cyan
  Start-Process -FilePath $dest -ArgumentList "/S" -Verb RunAs -Wait
  Write-Host "Silent installation completed." -ForegroundColor Green
} finally {
  Pop-Location
}