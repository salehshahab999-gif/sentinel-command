$ErrorActionPreference = 'Stop'

# Sentinel TeamSpeak 3 role profiles v2.
# Creates roles from empty groups; never uses servergroupcopy/channelgroupcopy.
# Existing groups named in roles-v2.spec.json are rebuilt from explicit profiles only.
# Built-in groups and client memberships are never edited.

$specPath = Join-Path $PSScriptRoot 'roles-v2.spec.json'
$builderPath = Join-Path $PSScriptRoot 'build-roles.cjs'
if (-not (Test-Path -LiteralPath $specPath)) { throw "roles-v2.spec.json was not found: $specPath" }
if (-not (Test-Path -LiteralPath $builderPath)) { throw "build-roles.cjs was not found: $builderPath" }
$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
if ($null -eq $nodeCommand) { throw 'Node.js is required to expand the compact role spec. Install/use Node.js, then rerun.' }
$manifestPath = Join-Path $env:TEMP ("sentinel-role-manifest-v2-{0}.json" -f [guid]::NewGuid().ToString('N'))
& $nodeCommand.Source $builderPath --spec $specPath --out $manifestPath
if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $manifestPath)) {
  throw 'Could not build the explicit role manifest from roles-v2.spec.json.'
}
try {
  $manifest = Get-Content -LiteralPath $manifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
} finally {
  Remove-Item -LiteralPath $manifestPath -Force -ErrorAction SilentlyContinue
}
if ($manifest.roles.Count -ne 29) { throw "Expected 29 role profiles; manifest has $($manifest.roles.Count)." }

function ConvertTo-Ts3Value([string]$Value) {
  $v = $Value.Replace('\', '\\')
  $v = $v.Replace(' ', '\s')
  $v = $v.Replace('|', '\p')
  $v = $v.Replace([string][char]13, '\r').Replace([string][char]10, '\n')
  return $v
}

function ConvertFrom-Ts3Value([string]$Value) {
  $v = $Value.Replace('\s', ' ').Replace('\p', '|').Replace('\r', [string][char]13).Replace('\n', [string][char]10)
  $v = $v.Replace('\\', '\')
  return $v
}

function Read-ServerQueryResponse {
  $items = New-Object 'System.Collections.Generic.List[string]'
  while ($true) {
    $line = $script:reader.ReadLine()
    if ($null -eq $line) { throw 'ServerQuery disconnected before returning a complete response.' }
    if ($line.Length -gt 0) { [void]$items.Add($line) }
    if ($line -match '^error id=\d+\s+msg=') { break }
  }
  return [string]::Join([string][char]10, $items)
}

function Invoke-ServerQuery([string]$Command) {
  $script:writer.WriteLine($Command)
  $response = Read-ServerQueryResponse
  # Stay below common ServerQuery anti-flood limits.
  Start-Sleep -Milliseconds 325
  $end = [regex]::Match($response, '(?m)^error id=(\d+)\s+msg=(.*)$')
  if (-not $end.Success) { throw "Incomplete ServerQuery response for '$($Command.Split(' ')[0])'." }
  if ([int]$end.Groups[1].Value -ne 0) {
    $msg = $end.Groups[2].Value.Replace('\s', ' ')
    throw "ServerQuery rejected '$($Command.Split(' ')[0])': error $($end.Groups[1].Value) - $msg"
  }
  return $response
}

function ConvertFrom-GroupList([string]$Response, [string]$IdField) {
  $groups = New-Object 'System.Collections.Generic.List[object]'
  foreach ($entry in ($Response -split '\|')) {
    $idMatch = [regex]::Match($entry, "(?:^|\s)$IdField=(\d+)")
    $nameMatch = [regex]::Match($entry, '(?:^|\s)name=(\S+)')
    $typeMatch = [regex]::Match($entry, '(?:^|\s)type=(\d+)')
    if ($idMatch.Success -and $nameMatch.Success) {
      $type = -1
      if ($typeMatch.Success) { $type = [int]$typeMatch.Groups[1].Value }
      [void]$groups.Add([pscustomobject]@{ Id=[int]$idMatch.Groups[1].Value; Name=(ConvertFrom-Ts3Value $nameMatch.Groups[1].Value); Type=$type })
    }
  }
  return $groups.ToArray()
}

function Get-PermissionNames([string]$ListCommand) {
  $response = Invoke-ServerQuery $ListCommand
  $names = New-Object 'System.Collections.Generic.List[string]'
  foreach ($entry in ($response -split '\|')) {
    $match = [regex]::Match($entry, '(?:^|\s)(?:permsid|permid)=([^\s]+)')
    if ($match.Success -and $match.Groups[1].Value -notmatch '^\d+$') {
      [void]$names.Add($match.Groups[1].Value)
    }
  }
  return @($names | Select-Object -Unique)
}

function Remove-AllServerGroupPermissions([int]$GroupId) {
  $names = @(Get-PermissionNames "servergrouppermlist sgid=$GroupId -permsid")
  for ($i=0; $i -lt $names.Count; $i += 30) {
    $last = [Math]::Min($i + 29, $names.Count - 1)
    $chunk = @($names[$i..$last])
    $args = ($chunk | ForEach-Object { 'permsid=' + $_ }) -join '|'
    if ($args) { $null = Invoke-ServerQuery "servergroupdelperm sgid=$GroupId $args" }
  }
}

function Remove-AllChannelGroupPermissions([int]$GroupId) {
  $names = @(Get-PermissionNames "channelgrouppermlist cgid=$GroupId -permsid")
  for ($i=0; $i -lt $names.Count; $i += 30) {
    $last = [Math]::Min($i + 29, $names.Count - 1)
    $chunk = @($names[$i..$last])
    $args = ($chunk | ForEach-Object { 'permsid=' + $_ }) -join '|'
    if ($args) { $null = Invoke-ServerQuery "channelgroupdelperm cgid=$GroupId $args" }
  }
}

function Ensure-ServerGroup([object]$Role, [object[]]$Groups) {
  $matches = @($Groups | Where-Object { $_.Name -ceq $Role.name })
  if ($matches.Count -gt 1) { throw "Multiple groups named '$($Role.name)' found. No group was changed for this role." }
  if ($matches.Count -eq 1) {
    if ($matches[0].Type -ne 1) { throw "'$($Role.name)' exists but is not a regular virtual-server group (type=$($matches[0].Type)); refusing to change it." }
    return [pscustomobject]@{ Id=[int]$matches[0].Id; Groups=$Groups; Created=$false }
  }
  $name = ConvertTo-Ts3Value ([string]$Role.name)
  $response = Invoke-ServerQuery "servergroupadd name=$name type=1"
  $m = [regex]::Match($response, '(?:^|\s)sgid=(\d+)')
  if (-not $m.Success) { throw "Server group '$($Role.name)' may have been created, but its ID could not be read." }
  $g = [pscustomobject]@{ Id=[int]$m.Groups[1].Value; Name=[string]$Role.name; Type=1 }
  return [pscustomobject]@{ Id=[int]$g.Id; Groups=(@($Groups) + @($g)); Created=$true }
}

function Ensure-ChannelGroup([object]$Role, [object[]]$Groups) {
  $matches = @($Groups | Where-Object { $_.Name -ceq $Role.name })
  if ($matches.Count -gt 1) { throw "Multiple channel groups named '$($Role.name)' found. No group was changed for this role." }
  if ($matches.Count -eq 1) { return [pscustomobject]@{ Id=[int]$matches[0].Id; Groups=$Groups; Created=$false } }
  $name = ConvertTo-Ts3Value ([string]$Role.name)
  $response = Invoke-ServerQuery "channelgroupadd name=$name"
  $m = [regex]::Match($response, '(?:^|\s)cgid=(\d+)')
  if (-not $m.Success) { throw "Channel group '$($Role.name)' may have been created, but its ID could not be read." }
  $g = [pscustomobject]@{ Id=[int]$m.Groups[1].Value; Name=[string]$Role.name; Type=-1 }
  return [pscustomobject]@{ Id=[int]$g.Id; Groups=(@($Groups) + @($g)); Created=$true }
}

function Add-ServerPermissions([int]$GroupId, [object[]]$Permissions) {
  # Batch small groups of permissions to avoid line-length limits.
  for ($i=0; $i -lt $Permissions.Count; $i += 20) {
    $last = [Math]::Min($i + 19, $Permissions.Count - 1)
    $chunk = @($Permissions[$i..$last])
    $parts = foreach ($p in $chunk) {
      'permsid={0} permvalue={1} permnegated={2} permskip={3}' -f $p.name,[int]$p.value,[int]$p.negate,[int]$p.skip
    }
    $null = Invoke-ServerQuery ("servergroupaddperm sgid=$GroupId " + ($parts -join '|'))
  }
}

function Add-ChannelPermissions([int]$GroupId, [object[]]$Permissions) {
  for ($i=0; $i -lt $Permissions.Count; $i += 20) {
    $last = [Math]::Min($i + 19, $Permissions.Count - 1)
    $chunk = @($Permissions[$i..$last])
    $parts = foreach ($p in $chunk) { 'permsid={0} permvalue={1}' -f $p.name,[int]$p.value }
    $null = Invoke-ServerQuery ("channelgroupaddperm cgid=$GroupId " + ($parts -join '|'))
  }
}

Write-Host ''
Write-Host 'Sentinel TeamSpeak 3 Role Profiles v2' -ForegroundColor Cyan
Write-Host '29 explicit profiles. New groups are created empty; servergroupcopy is never used.' -ForegroundColor Yellow
Write-Host 'Existing groups with the exact Sentinel names will have their explicit permissions replaced by the manifest.' -ForegroundColor Yellow
Write-Host 'Built-in groups, client memberships, icons, and channel hierarchy will not be changed.' -ForegroundColor Yellow
Write-Host ''
Write-Host 'Preview format: action Power / target Needed Power; Grant is permission-edit authority.' -ForegroundColor Cyan
foreach ($role in $manifest.roles) {
  Write-Host ('  {0,-13} {1,-34} {2,3} explicit permissions' -f $role.kind,$role.name,$role.permissions.Count)
  $pv = @{}
  foreach ($perm in $role.permissions) { $pv[[string]$perm.name] = [int]$perm.value }
  if ($role.kind -eq 'server_group') {
    $summary = '    S-Kick {0}/{1} | C-Kick {2}/{3} | Ban {4}/{5} | Move {6}/{7} | Poke {8}/{9} | Talk {10} | Join {11} | Grants {12} | BanRule {13} | BanCap(s) {14}' -f `
      $pv['i_client_kick_from_server_power'],$pv['i_client_needed_kick_from_server_power'],`
      $pv['i_client_kick_from_channel_power'],$pv['i_client_needed_kick_from_channel_power'],`
      $pv['i_client_ban_power'],$pv['i_client_needed_ban_power'],`
      $pv['i_client_move_power'],$pv['i_client_needed_move_power'],`
      $pv['i_client_poke_power'],$pv['i_client_needed_poke_power'],`
      $pv['i_client_talk_power'],$pv['i_channel_join_power'],`
      @($role.permissions | Where-Object { $_.name -like 'i_needed_modify_power_*' }).Count,`
      $pv['b_client_ban_create'],$pv['i_client_ban_max_bantime']
  } else {
    $summary = '    Channel Talk {0} | Join {1} | Subscribe {2} | Kick {3}/{4} | Move {5}/{6} | Poke {7}/{8} | ChannelModify {9}/{10}' -f `
      $pv['i_client_talk_power'],$pv['i_channel_join_power'],$pv['i_channel_subscribe_power'],`
      $pv['i_client_kick_from_channel_power'],$pv['i_client_needed_kick_from_channel_power'],`
      $pv['i_client_move_power'],$pv['i_client_needed_move_power'],$pv['i_client_poke_power'],`
      $pv['i_client_needed_poke_power'],$pv['i_channel_modify_power'],$pv['i_channel_needed_modify_power']
  }
  Write-Host $summary -ForegroundColor DarkGray
}
Write-Host ''
$confirm = Read-Host 'To continue, type exactly APPLY SENTINEL ROLE PROFILES V2'
if ($confirm -cne 'APPLY SENTINEL ROLE PROFILES V2') {
  Write-Host 'Cancelled. No ServerQuery connection or changes were made.' -ForegroundColor Yellow
  return
}

$queryUser = Read-Host 'ServerQuery Login username (not your TeamSpeak nickname)'
if ([string]::IsNullOrWhiteSpace($queryUser)) { throw 'A ServerQuery username is required.' }
$securePassword = Read-Host 'ServerQuery password (input hidden)' -AsSecureString
$ptr = [IntPtr]::Zero
$password = $null
$client = $null

try {
  $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
  $password = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
  $client = New-Object System.Net.Sockets.TcpClient
  $client.ReceiveTimeout = 12000
  $client.SendTimeout = 12000
  $client.Connect('127.0.0.1',10011)
  $stream = $client.GetStream()
  $stream.ReadTimeout = 12000
  $stream.WriteTimeout = 12000
  $script:reader = New-Object System.IO.StreamReader($stream,[System.Text.Encoding]::UTF8)
  $script:writer = New-Object System.IO.StreamWriter($stream,(New-Object System.Text.UTF8Encoding($false)))
  $script:writer.NewLine = [string][char]10
  $script:writer.AutoFlush = $true

  while ($true) {
    $line = $script:reader.ReadLine()
    if ($null -eq $line) { throw 'No ServerQuery welcome banner received.' }
    if ($line.Length -eq 0) { break }
  }
  $safeUser = ConvertTo-Ts3Value $queryUser
  $safePass = ConvertTo-Ts3Value $password
  $null = Invoke-ServerQuery "login client_login_name=$safeUser client_login_password=$safePass"
  $password = $null
  $safePass = $null
  $null = Invoke-ServerQuery 'use sid=1'

  $serverGroups = @(ConvertFrom-GroupList (Invoke-ServerQuery 'servergrouplist -type') 'sgid')
  $channelGroups = @(ConvertFrom-GroupList (Invoke-ServerQuery 'channelgrouplist') 'cgid')
  $serverRoleNames = @($manifest.roles | Where-Object { $_.kind -eq 'server_group' } | ForEach-Object { $_.name })
  $channelRoleNames = @($manifest.roles | Where-Object { $_.kind -eq 'channel_group' } | ForEach-Object { $_.name })

  # Refuse to continue if any role name is already represented by a built-in group.
  foreach ($builtIn in @('Server Admin','Normal','Guest')) {
    if ($serverRoleNames -contains $builtIn) { throw "Safety stop: manifest unexpectedly includes built-in server group '$builtIn'." }
  }
  foreach ($builtIn in @('Channel Admin','Operator','Voice','Guest')) {
    if ($channelRoleNames -contains $builtIn) { throw "Safety stop: manifest unexpectedly includes built-in channel group '$builtIn'." }
  }

  # Preflight every target before the first write. This prevents a late duplicate-name/type
  # collision from being discovered only after earlier groups have already been rebuilt.
  $serverPermissionSnapshots = New-Object 'System.Collections.Generic.List[object]'
  $channelPermissionSnapshots = New-Object 'System.Collections.Generic.List[object]'
  $backup = [ordered]@{
    created_at = (Get-Date).ToString('o')
    target = '127.0.0.1:10011 / virtual server 1'
    manifest_schema_version = $manifest.schema_version
    existing_server_groups = @()
    existing_channel_groups = @()
  }
  foreach ($role in $manifest.roles) {
    if ($role.kind -eq 'server_group') {
      $matches = @($serverGroups | Where-Object { $_.Name -ceq $role.name })
      if ($matches.Count -gt 1) { throw "Preflight stopped: multiple server groups named '$($role.name)' exist." }
      if ($matches.Count -eq 1) {
        if ($matches[0].Type -ne 1) { throw "Preflight stopped: '$($role.name)' is not a regular server group (type=$($matches[0].Type))." }
        $raw = Invoke-ServerQuery "servergrouppermlist sgid=$($matches[0].Id) -permsid"
        [void]$serverPermissionSnapshots.Add([pscustomobject]@{ id=$matches[0].Id; name=$role.name; permissions_response=$raw })
      }
    } elseif ($role.kind -eq 'channel_group') {
      $matches = @($channelGroups | Where-Object { $_.Name -ceq $role.name })
      if ($matches.Count -gt 1) { throw "Preflight stopped: multiple channel groups named '$($role.name)' exist." }
      if ($matches.Count -eq 1) {
        $raw = Invoke-ServerQuery "channelgrouppermlist cgid=$($matches[0].Id) -permsid"
        [void]$channelPermissionSnapshots.Add([pscustomobject]@{ id=$matches[0].Id; name=$role.name; permissions_response=$raw })
      }
    }
  }
  $backup.existing_server_groups = $serverPermissionSnapshots.ToArray()
  $backup.existing_channel_groups = $channelPermissionSnapshots.ToArray()
  $backupFile = Join-Path $PSScriptRoot ("sentinel-role-backup-v2-{0}.json" -f (Get-Date -Format 'yyyyMMdd-HHmmss'))
  $backup | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $backupFile -Encoding UTF8
  Write-Host ("Permission snapshot saved before changes: {0}" -f $backupFile) -ForegroundColor Cyan

  Write-Host ''
  Write-Host 'Preflight passed. Applying explicit profiles...' -ForegroundColor Green
  $done = 0
  foreach ($role in $manifest.roles) {
    if ($role.kind -eq 'server_group') {
      $result = Ensure-ServerGroup $role $serverGroups
      $serverGroups = @($result.Groups)
      Remove-AllServerGroupPermissions ([int]$result.Id)
      Add-ServerPermissions ([int]$result.Id) @($role.permissions)
    } elseif ($role.kind -eq 'channel_group') {
      $result = Ensure-ChannelGroup $role $channelGroups
      $channelGroups = @($result.Groups)
      Remove-AllChannelGroupPermissions ([int]$result.Id)
      Add-ChannelPermissions ([int]$result.Id) @($role.permissions)
    } else {
      throw "Unsupported role kind '$($role.kind)' in manifest."
    }
    $done++
    $status = if ($result.Created) { 'CREATED' } else { 'REBUILT' }
    Write-Host ('{0,-7} {1} (ID {2}; {3} permissions)' -f $status,$role.name,$result.Id,$role.permissions.Count) -ForegroundColor Green
  }

  Write-Host ''
  Write-Host ("PROFILE APPLY COMPLETE: {0}/{0} groups configured." -f $done) -ForegroundColor Green
  Write-Host 'No client group memberships were changed. SENTINEL OWNER was not assigned to any account.' -ForegroundColor Yellow
  Write-Host "Read docs before assigning protection overlays: add them alongside, not instead of, a user's main role." -ForegroundColor Yellow
}
finally {
  if ($null -ne $script:writer) { try { $script:writer.WriteLine('quit'); $script:writer.Flush() } catch {} }
  if ($null -ne $client) { $client.Close() }
  if ($ptr -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
  if ($null -ne $password) { $password = $null }
}