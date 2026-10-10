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
$backup = Join-Path $dest ('backup-hierarchy-update-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
New-Item -ItemType Directory -Path $backup | Out-Null
foreach ($file in ($files + @('roles-v2.expanded.json'))) {
  $old = Join-Path $dest $file
  if (Test-Path -LiteralPath $old) { Copy-Item -LiteralPath $old -Destination $backup }
}
foreach ($file in $files) {
  Invoke-WebRequest -UseBasicParsing -Uri "$base/$file" -OutFile (Join-Path $dest $file)
}
Set-Location $dest
node .\build-roles.cjs
if ($LASTEXITCODE -ne 0) { throw 'Manifest build failed.' }
node .\validate-roles.cjs
if ($LASTEXITCODE -ne 0) { throw 'Offline validation failed.' }
Write-Host "Local files updated. Backup: $backup" -ForegroundColor Green
Write-Host 'No TeamSpeak ServerQuery connection was made.' -ForegroundColor Yellow
