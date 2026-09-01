# Sentinel Windows Location Bridge

This is the first real PNT input for Sentinel. It is intentionally isolated from the Next.js runtime.

## Purpose

The bridge reads the Windows `Windows.Devices.Geolocation` API and emits one JSON object to stdout. Sentinel can later consume that output without coupling the core PNT switch to WinRT.

The bridge reports:

- latitude / longitude
- accuracy
- altitude when available
- speed when available
- heading when available
- Windows `PositionSource`
- GNSS satellite metadata when Windows provides it
- timestamp
- explicit error/access status

Microsoft documents that Windows Location can obtain positions from GNSS, Wi-Fi, cellular networks, IP address, or a configured default location. `Geocoordinate.PositionSource` identifies the source, and `SatelliteData` is available when the estimate is based on satellite signals.

## Build

Open a Developer PowerShell / PowerShell terminal in this directory:

```powershell
dotnet restore
dotnet build
```

## Run

```powershell
dotnet run
```

The program prints one JSON line and exits. It is a probe, not yet a background service.

If Windows denies location access, the bridge returns `ACCESS_DENIED` rather than inventing a position. Enable Windows Location in Settings and allow the application to access location, then run the probe again.

## Important architecture rule

Do not treat `WINDOWS_LOCATION`, `WINDOWS_WIFI`, and `NETWORK_IP` as three independent satellite receivers. Windows may use network-derived providers. The PNT switch therefore keeps source identity and independence metadata.

Future physical receivers are reserved as:

- `GNSS_RECEIVER_1`
- `GNSS_RECEIVER_2`

The switch is designed so additional receivers can be added without changing the PNT contract.
