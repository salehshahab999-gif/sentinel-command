$ErrorActionPreference = 'Stop'

# READ-ONLY channel audit for TeamSpeak 3 ServerQuery.
# Sends only: login, use, channellist, channelinfo, channelpermlist, quit.
# No channel/group/permission edit commands are issued.

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

function Get-ExplicitPermissionValue([string]$Response, [string]$PermissionName) {
  foreach ($entry in ($Response -split '\|')) {
    $name = Get-Field $entry 'permsid'
    if ($name -ceq $PermissionName) {
      $value = Get-Field $entry 'permvalue'
      if ($null -ne $value) { return [int]$value }
    }
  }
  return $null
}

function Get-ChannelPath([object]$Channel, [hashtable]$ById) {
  $parts = New-Object 'System.Collections.Generic.List[string]'
  $current = $Channel
  for ($depth = 0; $null -ne $current -and $depth -lt 40; $depth++) {
    $parts.Insert(0, [string]$current.Name)
    if ($current.Pid -le 0 -or -not $ById.ContainsKey([int]$current.Pid)) { break }
    $current = $ById[[int]$current.Pid]
  }
  return ($parts -join ' / ')
}

$queryUser = Read-Host 'ServerQuery username [sentinel_channels_setup]'
if ([string]::IsNullOrWhiteSpace($queryUser)) { $queryUser = 'sentinel_channels_setup' }
$securePassword = Read-Host 'ServerQuery password (hidden; do not paste it into chat)' -AsSecureString
$ptr = [IntPtr]::Zero
$password = $null
$client = $null
$script:reader = $null
$script:writer = $null

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

  Write-Host 'Connection authenticated. Reading channel configuration only...' -ForegroundColor Cyan
  $listResponse = Invoke-ServerQuery 'channellist -flags -topic'
  $channels = New-Object 'System.Collections.Generic.List[object]'

  foreach ($entry in ($listResponse -split '\|')) {
    $cidText = Get-Field $entry 'cid'
    $nameText = Get-Field $entry 'channel_name'
    if ($null -eq $cidText -or $null -eq $nameText) { continue }
    $pidText = Get-Field $entry 'pid'
    $channel = [pscustomobject]@{
      Cid = [int]$cidText
      Pid = if ($null -ne $pidText) { [int]$pidText } else { 0 }
      Name = ConvertFrom-Ts3Value $nameText
    }
    [void]$channels.Add($channel)
  }

  if ($channels.Count -eq 0) { throw 'The channel list was empty or could not be parsed.' }

  $byId = @{}
  foreach ($channel in $channels) { $byId[[int]$channel.Cid] = $channel }

  $rows = New-Object 'System.Collections.Generic.List[object]'
  $index = 0
  foreach ($channel in $channels) {
    $index++
    Write-Progress -Activity 'Read-only TeamSpeak channel audit' -Status "$index of $($channels.Count): $($channel.Name)" -PercentComplete ([int](100 * $index / $channels.Count))

    $info = Invoke-ServerQuery "channelinfo cid=$($channel.Cid)"
    $permissionResponse = Invoke-ServerQuery "channelpermlist cid=$($channel.Cid) -permsid"

    $talkPropertyText = Get-Field $info 'channel_needed_talk_power'
    $talkProperty = if ($null -ne $talkPropertyText) { [int]$talkPropertyText } else { $null }
    $joinPermission = Get-ExplicitPermissionValue $permissionResponse 'i_channel_needed_join_power'
    $talkPermission = Get-ExplicitPermissionValue $permissionResponse 'i_client_needed_talk_power'
    $subscribePermission = Get-ExplicitPermissionValue $permissionResponse 'i_channel_needed_subscribe_power'
    $permissionCount = @(
      foreach ($entry in ($permissionResponse -split '\|')) {
        if ($null -ne (Get-Field $entry 'permsid')) { 1 }
      }
    ).Count

    $rows.Add([pscustomobject]@{
      ChannelPath = Get-ChannelPath $channel $byId
      ChannelID = $channel.Cid
      ParentID = $channel.Pid
      ChannelTalkThreshold = if ($null -ne $talkProperty) { $talkProperty } else { 'not returned' }
      ExplicitNeededJoinPower = if ($null -ne $joinPermission) { $joinPermission } else { 'not set (default 0)' }
      ExplicitNeededTalkPower = if ($null -ne $talkPermission) { $talkPermission } else { 'not set' }
      ExplicitNeededSubscribePower = if ($null -ne $subscribePermission) { $subscribePermission } else { 'not set (default 0)' }
      ExplicitPermissionCount = $permissionCount
    })
  }

  Write-Progress -Activity 'Read-only TeamSpeak channel audit' -Completed
  $outputPath = Join-Path $PSScriptRoot ("sentinel-channel-audit-{0}.csv" -f (Get-Date -Format 'yyyyMMdd-HHmmss'))
  $rows | Export-Csv -LiteralPath $outputPath -NoTypeInformation -Encoding UTF8

  Write-Host ''
  Write-Host "Read-only audit complete: $($rows.Count) channels." -ForegroundColor Green
  Write-Host "CSV saved to: $outputPath" -ForegroundColor Cyan
  $rows | Format-Table ChannelPath, ChannelTalkThreshold, ExplicitNeededJoinPower, ExplicitNeededTalkPower -AutoSize
  Write-Host 'No TeamSpeak channel or permission settings were changed.' -ForegroundColor Yellow
}
finally {
  if ($null -ne $script:writer) { try { $script:writer.WriteLine('quit'); $script:writer.Flush() } catch {} }
  if ($null -ne $client) { $client.Close() }
  if ($ptr -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
  $password = $null
}
