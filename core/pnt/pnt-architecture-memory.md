# Sentinel PNT Architecture Memory

## Purpose
PNT is a local-first positioning layer for Sentinel. It must continue operating when external connectivity is unavailable.

## Architecture Warnings

### Warning 1: No single hardware SPOF
A single physical GNSS receiver must never be the only PNT source.

### Warning 2: No historical bypass assumption
No historical connectivity workaround, filtering gap, proxy path, or bypass is treated as guaranteed for future network conditions.

### Warning 3: Research-first implementation
Before PNT implementation changes, prefer current official documentation plus current GitHub/community evidence. Verify API surface and real behavior before coding. Separate confirmed platform behavior from community reports and hypotheses.

## Source Independence

The PNT layer distinguishes logical source identity from physical independence. Windows Location may expose Satellite, WiFi, Cellular, or IPAddress. These are provider identities, not automatically independent physical devices.

Windows Satellite must not be counted as a second independent receiver when it is delivered through the same Windows Location hardware/provider path.

Browser geolocation is not assumed to be independent from Windows Location.

## Current Logical Sources

- WINDOWS_LOCATION
- WINDOWS_SATELLITE
- WINDOWS_WIFI
- NETWORK_IP
- GNSS_RECEIVER_1
- GNSS_RECEIVER_2

GNSS_RECEIVER_1 and GNSS_RECEIVER_2 are reserved for future independent hardware. No physical receiver is currently installed on the test PC.

## Selection Rules

PNT source selection considers:

- source health
- confidence
- freshness
- reported accuracy
- source priority
- previous active source
- last-known position

Supported decision modes:

- LIVE
- FAILOVER
- LAST_KNOWN
- NO_POSITION

## Current Test State

The Windows Location bridge and TypeScript runner are operational. On the current PC Windows reports provider `IPAddress` with approximately 3581 m accuracy. This is a valid coarse location observation, not GNSS.

## Offline Principle

Internet loss must not terminate PNT. Local observations, last-known position, and local analysis remain available. External synchronization is a separate subsystem.

## Implementation Principle

Build the architecture progressively. Do not activate hardware or remote dependencies until the free local test path is validated.
