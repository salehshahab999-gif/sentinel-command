$ErrorActionPreference = 'Stop'
$dest = $PSScriptRoot
$base = 'https://raw.githubusercontent.com/salehshahab999-gif/sentinel-command/refs/heads/feat/teamspeak-rank-profiles-v2/ops/teamspeak'
$files = @(
  'apply-sentinel-roles-v2.ps1',
  'build-roles.cjs',
  'rank-power-matrix.csv',
  'README-fa.md',
  'roles-v2.spec.json',
  'validate-roles.cjs',
  'channel-thresholds-v1.json',
  'configure-sentinel-channel-thresholds.ps1'
)
$temp = Join-Path $env:TEMP ('sentinel-hierarchy-download-' + [guid]::NewGuid().ToString('N'))
$backup = Join-Path $dest ('backup-hierarchy-update-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
$tracked = $files + @('roles-v2.expanded.json')
$originalLocation = Get-Location
New-Item -ItemType Directory -Path $temp | Out-Null
New-Item -ItemType Directory -Path $backup | Out-Null
try {
  # Download the entire update to a temporary directory first.
  foreach ($file in $files) {
    Invoke-WebRequest -UseBasicParsing -Uri "$base/$file" -OutFile (Join-Path $temp $file)
  }
  # Preserve every existing file before replacing anything.
  foreach ($file in $tracked) {
    $old = Join-Path $dest $file
    if (Test-Path -LiteralPath $old) { Copy-Item -LiteralPath $old -Destination $backup }
  }
  # Copy only after all downloads succeed.
  foreach ($file in $files) {
    Copy-Item -LiteralPath (Join-Path $temp $file) -Destination $dest -Force
  }
  Set-Location $dest
  node .\build-roles.cjs
  if ($LASTEXITCODE -ne 0) { throw 'Manifest build failed.' }
  node .\validate-roles.cjs
  if ($LASTEXITCODE -ne 0) { throw 'Offline validation failed.' }
  Write-Host "Local files updated and validated. Backup: $backup" -ForegroundColor Green
  Write-Host 'No TeamSpeak ServerQuery connection was made.' -ForegroundColor Yellow
} catch {
  Write-Host 'Update or validation failed. Restoring previous local files...' -ForegroundColor Red
  foreach ($file in $tracked) {
    $old = Join-Path $backup $file
    $current = Join-Path $dest $file
    if (Test-Path -LiteralPath $old) {
      Copy-Item -LiteralPath $old -Destination $current -Force
    } elseif (Test-Path -LiteralPath $current) {
      Remove-Item -LiteralPath $current -Force
    }
  }
  throw
} finally {
  Set-Location $originalLocation
  Remove-Item -LiteralPath $temp -Recurse -Force -ErrorAction SilentlyContinue
}
