param(
  [switch]$Deep
)

Write-Host "Mulfa clean script starting..." -ForegroundColor Cyan
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

function Remove-Path([string]$p) {
  if (Test-Path -LiteralPath $p) {
    try {
      Remove-Item -LiteralPath $p -Recurse -Force -ErrorAction Stop
      Write-Host "Removed: $p"
    } catch {
      $ts = Get-Date -Format "yyyyMMdd-HHmmss"
      $backup = "$p-old-$ts"
      try {
        Rename-Item -LiteralPath $p -NewName (Split-Path -Leaf $backup) -ErrorAction Stop
        Remove-Item -LiteralPath $backup -Recurse -Force -ErrorAction Stop
        Write-Host "Renamed and removed (after lock): $p"
      } catch {
        Write-Warning "Failed to remove $p due to lock or permissions: $($_.Exception.Message)"
      }
    }
  } else {
    Write-Host "Path not found: $p"
  }
}

# Clean electron build outputs only (keep web-build to allow local preview)
Remove-Path "dist_electron"
Remove-Path "dist_electron_new"

# Remove builder debug/effective config files if present
foreach ($f in @(
  "dist_electron\builder-debug.yml",
  "dist_electron\builder-effective-config.yaml",
  "dist_electron_new\builder-effective-config.yaml"
)) {
  if (Test-Path -LiteralPath $f) {
    try { Remove-Item -LiteralPath $f -Force -ErrorAction Stop; Write-Host "Removed: $f" } catch { Write-Warning "Failed to remove $f: $($_.Exception.Message)" }
  }
}

if ($Deep) {
  # Optional deep clean: remove Expo web build and cache
  Remove-Path "web-build"
  Remove-Path ".expo"
  Remove-Path ".cache"
}

Write-Host "Mulfa clean completed." -ForegroundColor Green