#!/usr/bin/env python3
"""Open a source-backed annual Earth System review issue via the GitHub REST API."""
from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone


def api_request(url: str, token: str, method: str = "GET", payload: dict | None = None):
    body = json.dumps(payload).encode("utf-8") if payload is not None else None
    request = urllib.request.Request(
        url,
        data=body,
        method=method,
        headers={
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {token}",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "sentinel-earth-system-annual-review",
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            raw = response.read().decode("utf-8")
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"GitHub API returned HTTP {exc.code}: {detail}") from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(f"Could not reach GitHub API: {exc}") from exc


def main() -> int:
    token = os.environ.get("GH_TOKEN", "").strip()
    repository = os.environ.get("GITHUB_REPOSITORY", "").strip()
    target_raw = os.environ.get("TARGET_YEAR", "").strip()
    if not token or "/" not in repository:
        print("GH_TOKEN or GITHUB_REPOSITORY is missing.", file=sys.stderr)
        return 2

    if target_raw:
        try:
            target_year = int(target_raw)
            if target_year < 1900 or target_year > 2200:
                raise ValueError
        except ValueError:
            print("TARGET_YEAR must be a four-digit year between 1900 and 2200.", file=sys.stderr)
            return 2
    else:
        target_year = datetime.now(timezone.utc).year - 1

    previous_year = target_year - 1
    title = f"🌍 Earth System annual review: {target_year} vs {previous_year}"
    base = f"https://api.github.com/repos/{repository}"
    existing = api_request(f"{base}/issues?state=open&per_page=100", token)
    for issue in existing:
        if issue.get("title") == title and "pull_request" not in issue:
            print(f"Annual review already exists: {issue.get('html_url')}")
            return 0

    body = f"""## Annual global Earth-system update

Prepare the complete comparison for **{target_year} versus {previous_year}**. Use the same source family, product definition, unit, baseline, geography and observation window wherever possible.

### Required work

- [ ] Global annual temperature anomaly, same baseline (1850–1900) and documented WMO synthesis method.
- [ ] Greenhouse-gas annual means (CO₂, CH₄, N₂O), WMO Global Atmosphere Watch network.
- [ ] Fossil CO₂ emissions, Global Carbon Budget. Keep preliminary and consolidated estimates distinguished.
- [ ] Energy-related CO₂ emissions, IEA. Do not average with Global Carbon Budget totals.
- [ ] Ocean heat content, with full-depth/upper-ocean scope and product method stated.
- [ ] Global mean sea level, same NASA altimetry reference series and matching month or annual statistic.
- [ ] Mountain glacier mass balance, matching WGMS hydrological-year definition.
- [ ] Greenland and Antarctic ice-sheet mass, matching GRACE/GRACE-FO product and time window.
- [ ] Arctic annual minimum and Antarctic annual maximum sea-ice extent, with NASA/NSIDC and NIPR products kept separate.
- [ ] Ozone, seafloor mapping coverage, global volcano catalogue and seismology context, with release versions and definitions.
- [ ] Regional country indicators, each compared only against that country's own stated climatological normal.
- [ ] Update annual-observations.csv, indicator-snapshot.csv and source-register.csv with source URLs, observation periods, publication dates, product/method keys and uncertainty.
- [ ] Regenerate the dashboard and annual comparison by running: python earth-system-global-review/scripts/build_dashboard.py
- [ ] Run python earth-system-global-review/scripts/validate.py and review the generated single-page report.

### Evidence rules

1. Prefer original data portals and national/international observing agencies.
2. Separate observation time, publication date and retrieval date.
3. A forecast is not an observation. A preliminary estimate is not a final consolidated value.
4. Do not calculate a percentage for temperature anomalies or precipitation departures; report absolute changes or percentage-point changes.
5. Use a percentage only when mathematically meaningful. Prefer a source-reported growth rate when displayed source values are rounded.
6. Preserve different sea-ice products and incompatible baselines rather than averaging.
7. If a comparable value is not released yet, mark it as pending. Never fill gaps by interpolation or guesswork.
8. State whether raw satellite, sonar, AIS or waveform data were independently processed. Do not imply that simply reading a published assessment is raw-data processing.

### AI-assisted research

AI tools may help locate sources, read documentation, compare tables and draft evidence notes. Every inserted value must be opened and verified against the original source before publication. Forum posts and social-media reports are leads, not representative measurements or scientific ground truth.

**Publication target:** a dated year-over-year revision of the single-page report, with a changelog entry and reproducible data files.
"""

    created = api_request(
        f"{base}/issues",
        token,
        method="POST",
        payload={"title": title, "body": body},
    )
    print(f"Created annual review issue #{created.get('number')}: {created.get('html_url')}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
