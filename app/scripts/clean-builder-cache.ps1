param(
  [switch]$NsisOnly
)

function Remove-CachePath([string]$Path) {
  if ([string]::IsNullOrWhiteSpace($Path)) { return }
  if (Test-Path -LiteralPath $Path) {
    Write-Host "Removing cache path: $Path"
    try {
      Remove-Item -LiteralPath $Path -Recurse -Force -ErrorAction Stop
      Write-Host "Removed: $Path"
    }
    catch {
      Write-Warning "Failed to remove: $Path. Error: $($_.Exception.Message)"
    }
  }
  else {
    Write-Host "No cache found at: $Path"
  }
}

$cacheRoot = Join-Path $env:LOCALAPPDATA 'electron-builder'
$cacheDir  = Join-Path $cacheRoot 'Cache'
$nsisDir   = Join-Path $cacheDir 'nsis'

Write-Host "Electron Builder cache root: $cacheRoot"

if ($NsisOnly) {
  Remove-CachePath $nsisDir
}
else {
  Remove-CachePath $cacheDir
}

Write-Host "Done. You can now rerun electron-builder and it will redownload toolchains as needed."