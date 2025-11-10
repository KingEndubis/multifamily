Write-Host "Mulfa silent installer helper starting..." -ForegroundColor Cyan
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

$candidateDirs = @("dist_electron_new", "dist_electron")
$installer = $null

foreach ($d in $candidateDirs) {
  $path = Join-Path $root $d
  if (Test-Path -LiteralPath $path) {
    $exe = Get-ChildItem -LiteralPath $path -Filter "Mulfa-Setup-*.exe" -File -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($exe) { $installer = $exe.FullName; break }
  }
}

if (-not $installer) {
  Write-Error "Installer not found. Please run packaging first (npm run package:win:new)."
  exit 1
}

$desktop = [Environment]::GetFolderPath("Desktop")
$copyTarget = Join-Path $desktop (Split-Path $installer -Leaf)
try {
  Copy-Item -LiteralPath $installer -Destination $copyTarget -Force
  Write-Host "Copied installer to: $copyTarget" -ForegroundColor Green
} catch {
  Write-Warning "Failed to copy installer: $($_.Exception.Message)"
}

Write-Host "Running silent install... (this may require UAC elevation)"
try {
  Start-Process -FilePath $copyTarget -ArgumentList "/S" -Verb RunAs -Wait
  Write-Host "Silent install completed." -ForegroundColor Green
} catch {
  Write-Warning "Silent install failed or was canceled: $($_.Exception.Message)"
}