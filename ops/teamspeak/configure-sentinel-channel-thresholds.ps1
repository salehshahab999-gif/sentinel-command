$ErrorActionPreference = 'Stop'

# Applies only the two hierarchy thresholds for the 33 channels declared in channel-thresholds-v1.json.
# Does not alter group memberships, channel groups, channel names, or unrelated permissions.

function ConvertTo-Ts3Value([string]$Value) {
  $v = $Value.Replace('\', '\\')
  $v = $v.Replace(' ', '\s')
  $v = $v.Replace('|', '\p')
  $v = $v.Replace([string][char]13, '\r').Replace([string][char]10, '\n')
  return $v
}
function ConvertFrom-Ts3Value([string]$Value) {
  $v = $Value.Replace('\s', ' ').Replace('\p', '|').Replace('\r', [string][char]13).Replace('\n', [string][char]10)
  return $v.Replace('\\', '\')
}
function Read-ServerQueryResponse {
  $items = New-Object 'System.Collections.Generic.List[string]'
  while ($true) {
    $line = $script:reader.ReadLine()
    if ($null -eq $line) { throw 'ServerQuery disconnected before a complete response.' }
    if ($line.Length -gt 0) { [void]$items.Add($line) }
    if ($line -match '^error id=\d+\s+msg=') { break }
  }
  return [string]::Join([string][char]10, $items)
}
function Invoke-ServerQuery([string]$Command) {
  $script:writer.WriteLine($Command)
  $response = Read-ServerQueryResponse
  Start-Sleep -Milliseconds 325
  $end = [regex]::Match($response, '(?m)^error id=(\d+)\s+msg=(.*)$')
  if (-not $end.Success) { throw "Incomplete response for command '$($Command.Split(' ')[0])'." }
  if ([int]$end.Groups[1].Value -ne 0) {
    $msg = $end.Groups[2].Value.Replace('\s', ' ')
    throw "ServerQuery rejected '$($Command.Split(' ')[0])': error $($end.Groups[1].Value) - $msg"
  }
  return $response
}
function Get-Field([string]$Entry, [string]$FieldName) {
  $m = [regex]::Match($Entry, "(?:^|\s)$([regex]::Escape($FieldName))=(\S+)")
  if ($m.Success) { return $m.Groups[1].Value }
  return $null
}
function Get-ExplicitJoinPermission([string]$Response) {
  foreach ($entry in ($Response -split '\|')) {
    $name = Get-Field $entry 'permsid'
    if ($name -ceq 'i_channel_needed_join_power') {
      $value = Get-Field $entry 'permvalue'
      if ($null -ne $value) { return [pscustomobject]@{ IsSet=$true; Value=[int]$value } }
    }
  }
  return [pscustomobject]@{ IsSet=$false; Value=$null }
}
function Get-ChannelPath([object]$Channel, [hashtable]$ById) {
  $parts = New-Object 'System.Collections.Generic.List[string]'
  $current = $Channel
  for ($depth=0; $null -ne $current -and $depth -lt 40; $depth++) {
    $parts.Insert(0, [string]$current.Name)
    if ($current.Pid -le 0 -or -not $ById.ContainsKey([int]$current.Pid)) { break }
    $current = $ById[[int]$current.Pid]
  }
  return ($parts -join ' / ')
}
function Restore-ChannelSnapshot([object]$Snapshot) {
  $currentPerms = Invoke-ServerQuery "channelpermlist cid=$($Snapshot.ChannelId) -permsid"
  $currentJoin = Get-ExplicitJoinPermission $currentPerms
  if ($currentJoin.IsSet) {
    $null = Invoke-ServerQuery "channeldelperm cid=$($Snapshot.ChannelId) permsid=i_channel_needed_join_power"
  }
  if ($Snapshot.OldJoinIsSet) {
    $null = Invoke-ServerQuery "channeladdperm cid=$($Snapshot.ChannelId) permsid=i_channel_needed_join_power permvalue=$($Snapshot.OldJoinPower)"
  }
  $null = Invoke-ServerQuery "channeledit cid=$($Snapshot.ChannelId) channel_needed_talk_power=$($Snapshot.OldTalkPower)"
}

$configPath = Join-Path $PSScriptRoot 'channel-thresholds-v1.json'
if (-not (Test-Path -LiteralPath $configPath)) { throw "Channel policy file not found: $configPath" }
$config = Get-Content -LiteralPath $configPath -Raw -Encoding UTF8 | ConvertFrom-Json
if ($config.schema_version -ne 1 -or $config.policy -ne 'hierarchical') { throw 'Unsupported or non-hierarchical channel policy.' }
if ($config.channels.Count -ne 33 -or $config.expected_channels -ne 33) { throw 'Expected policy for exactly 33 channels.' }
if (@($config.channels | Select-Object -ExpandProperty path -Unique).Count -ne 33) { throw 'Channel policy contains duplicate paths.' }

Write-Host ''
Write-Host 'Sentinel hierarchical channel thresholds v1' -ForegroundColor Cyan
Write-Host 'Preview only until the exact confirmation phrase is entered.' -ForegroundColor Yellow
Write-Host 'This edits only each channel Needed Join Power and Needed Talk Power.' -ForegroundColor Yellow
Write-Host 'It does not assign ranks to clients; members still in Normal may retain Normal access until their rank is assigned.' -ForegroundColor Yellow
$config.channels | Select-Object path,join_power,talk_power | Format-Table -AutoSize
Write-Host ''
$confirm = Read-Host 'To apply these 33 channel thresholds, type exactly APPLY SENTINEL CHANNEL THRESHOLDS V1'
if ($confirm -cne 'APPLY SENTINEL CHANNEL THRESHOLDS V1') {
  Write-Host 'Cancelled. No ServerQuery connection or channel changes were made.' -ForegroundColor Yellow
  return
}

$queryUser = Read-Host 'ServerQuery username [sentinel_channels_setup]'
if ([string]::IsNullOrWhiteSpace($queryUser)) { $queryUser = 'sentinel_channels_setup' }
$securePassword = Read-Host 'ServerQuery password (hidden; do not paste it into chat)' -AsSecureString
$ptr = [IntPtr]::Zero
$password = $null
$client = $null
$script:reader = $null
$script:writer = $null
$backupFile = $null
$snapshots = New-Object 'System.Collections.Generic.List[object]'
$changesStarted = $false

try {
  $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
  $password = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
  $client = New-Object System.Net.Sockets.TcpClient
  $client.ReceiveTimeout = 12000
  $client.SendTimeout = 12000
  $client.Connect('127.0.0.1', 10011)
  $stream = $client.GetStream()
  $stream.ReadTimeout = 12000
  $stream.WriteTimeout = 12000
  $script:reader = New-Object System.IO.StreamReader($stream, [System.Text.Encoding]::UTF8)
  $script:writer = New-Object System.IO.StreamWriter($stream, (New-Object System.Text.UTF8Encoding($false)))
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
  Write-Host 'Authenticated. Checking all 33 channel paths and taking a backup...' -ForegroundColor Cyan

  $listResponse = Invoke-ServerQuery 'channellist -flags -topic'
  $channels = New-Object 'System.Collections.Generic.List[object]'
  foreach ($entry in ($listResponse -split '\|')) {
    $cidText = Get-Field $entry 'cid'
    $nameText = Get-Field $entry 'channel_name'
    if ($null -eq $cidText -or $null -eq $nameText) { continue }
    $pidText = Get-Field $entry 'pid'
    [void]$channels.Add([pscustomobject]@{
      Cid=[int]$cidText
      Pid=if ($null -ne $pidText) { [int]$pidText } else { 0 }
      Name=(ConvertFrom-Ts3Value $nameText)
    })
  }
  $byId = @{}
  foreach ($channel in $channels) { $byId[[int]$channel.Cid] = $channel }
  $foundPaths = @{}
  foreach ($channel in $channels) {
    $path = Get-ChannelPath $channel $byId
    if (-not $foundPaths.ContainsKey($path)) { $foundPaths[$path] = New-Object 'System.Collections.Generic.List[object]' }
    [void]$foundPaths[$path].Add($channel)
  }

  foreach ($target in $config.channels) {
    if (-not $foundPaths.ContainsKey([string]$target.path)) { throw "Preflight stopped: channel path not found: $($target.path)" }
    if ($foundPaths[[string]$target.path].Count -ne 1) { throw "Preflight stopped: duplicate channel path: $($target.path)" }
    $channel = $foundPaths[[string]$target.path][0]
    $info = Invoke-ServerQuery "channelinfo cid=$($channel.Cid)"
    $perms = Invoke-ServerQuery "channelpermlist cid=$($channel.Cid) -permsid"
    $talkText = Get-Field $info 'channel_needed_talk_power'
    if ($null -eq $talkText -or $talkText -notmatch '^-?\d+$') { throw "Preflight stopped: could not read current talk threshold on $($target.path)" }
    $join = Get-ExplicitJoinPermission $perms
    [void]$snapshots.Add([pscustomobject]@{
      Path=[string]$target.path
      ChannelId=[int]$channel.Cid
      JoinPower=[int]$target.join_power
      TalkPower=[int]$target.talk_power
      OldJoinIsSet=[bool]$join.IsSet
      OldJoinPower=if ($join.IsSet) { [int]$join.Value } else { $null }
      OldTalkPower=[int]$talkText
    })
  }
  if ($snapshots.Count -ne 33) { throw "Preflight stopped: matched $($snapshots.Count) of 33 channel paths." }

  $backup = [ordered]@{
    created_at=(Get-Date).ToString('o')
    target='127.0.0.1:10011 / virtual server 1'
    policy='hierarchical'
    changes='i_channel_needed_join_power and channel_needed_talk_power only'
    channels=$snapshots.ToArray()
  }
  $backupFile = Join-Path $PSScriptRoot ("sentinel-channel-threshold-backup-{0}.json" -f (Get-Date -Format 'yyyyMMdd-HHmmss'))
  $backup | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $backupFile -Encoding UTF8
  Write-Host "Backup saved: $backupFile" -ForegroundColor Cyan

  $changesStarted = $true
  foreach ($snapshot in $snapshots) {
    if ($snapshot.OldJoinIsSet) {
      $null = Invoke-ServerQuery "channeldelperm cid=$($snapshot.ChannelId) permsid=i_channel_needed_join_power"
    }
    $null = Invoke-ServerQuery "channeladdperm cid=$($snapshot.ChannelId) permsid=i_channel_needed_join_power permvalue=$($snapshot.JoinPower)"
    $null = Invoke-ServerQuery "channeledit cid=$($snapshot.ChannelId) channel_needed_talk_power=$($snapshot.TalkPower)"
    Write-Host ("SET {0} | join >= {1} | talk >= {2}" -f $snapshot.Path,$snapshot.JoinPower,$snapshot.TalkPower) -ForegroundColor Green
  }

  foreach ($snapshot in $snapshots) {
    $info = Invoke-ServerQuery "channelinfo cid=$($snapshot.ChannelId)"
    $perms = Invoke-ServerQuery "channelpermlist cid=$($snapshot.ChannelId) -permsid"
    $talkActual = Get-Field $info 'channel_needed_talk_power'
    $joinActual = Get-ExplicitJoinPermission $perms
    if ([int]$talkActual -ne $snapshot.TalkPower -or -not $joinActual.IsSet -or [int]$joinActual.Value -ne $snapshot.JoinPower) {
      throw "Verification failed for $($snapshot.Path)."
    }
  }
  $changesStarted = $false
  Write-Host ''
  Write-Host 'PASS: all 33 channel thresholds were applied and verified.' -ForegroundColor Green
  Write-Host 'No channel memberships, group memberships, or unrelated permissions were changed.' -ForegroundColor Yellow
}
catch {
  $failure = $_
  if ($changesStarted -and $snapshots.Count -gt 0) {
    Write-Host 'ERROR after writes began. Attempting to restore the saved values...' -ForegroundColor Red
    foreach ($snapshot in $snapshots) {
      try { Restore-ChannelSnapshot $snapshot }
      catch { Write-Host ("ROLLBACK WARNING: {0}: {1}" -f $snapshot.Path,$_.Exception.Message) -ForegroundColor Red }
    }
    Write-Host "Inspect backup: $backupFile" -ForegroundColor Yellow
  }
  throw $failure
}
finally {
  if ($null -ne $script:writer) { try { $script:writer.WriteLine('quit'); $script:writer.Flush() } catch {} }
  if ($null -ne $client) { $client.Close() }
  if ($ptr -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
  $password = $null
}
