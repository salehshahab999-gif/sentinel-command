#!/usr/bin/env python3
"""Validate the public Global Earth System Review documentation and CSV snapshots.

Uses only the Python standard library; no third-party packages or network access.
"""
from __future__ import annotations

import csv
import re
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REQUIRED_FILES = [
    "README.md", "EXECUTIVE-ASSESSMENT.md",
    "CLIMATE-CRYOSPHERE-ATMOSPHERE.md", "SOLID-EARTH-INTERIOR-TECTONICS.md",
    "VOLCANOES-SUBMARINE-VOLCANISM.md", "GLOBAL-SEISMOLOGY.md",
    "OCEAN-FLOOR-AND-MARINE-OBSERVING.md", "PALEO-EARTH-AND-DEEP-TIME.md",
    "CROSS-COUNTRY-SOURCE-RECONCILIATION.md", "SOURCE-CATALOG.md",
    "METHODS-UNCERTAINTY-AND-REPRODUCIBILITY.md", "ROADMAP-AND-CONTRIBUTING.md",
    "GLOSSARY.md", "CHANGELOG.md", "CITATION.cff",
    "data/indicator-snapshot.csv", "data/source-register.csv", "data/README.md", "LICENSE.txt",
]
SCHEMAS = {
    "data/indicator-snapshot.csv": [
        "indicator_id", "domain", "indicator", "value", "unit", "period",
        "reference_baseline", "geographic_scope", "status",
        "uncertainty_or_rank", "source_id", "source_url", "notes",
    ],
    "data/source-register.csv": [
        "source_id", "institution", "country_or_scope", "domain",
        "product_or_report", "observation_period_or_coverage",
        "publication_or_update_date", "source_url", "evidence_type",
        "typical_update", "notes",
    ],
}

def valid_date(value: str) -> bool:
    for fmt in ("%Y", "%Y-%m", "%Y-%m-%d"):
        try:
            datetime.strptime(value, fmt)
            return True
        except ValueError:
            pass
    return False

def check_csv(relative: str, columns: list[str]) -> tuple[bool, set[str]]:
    path = ROOT / relative
    if not path.is_file():
        print(f"ERROR: missing {relative}", file=sys.stderr)
        return False, set()
    ok = True
    ids: set[str] = set()
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        if reader.fieldnames != columns:
            print(f"ERROR: schema mismatch in {relative}", file=sys.stderr)
            return False, set()
        rows = 0
        for line, row in enumerate(reader, start=2):
            rows += 1
            stable_id = row.get("indicator_id") or row.get("source_id") or ""
            if not stable_id or stable_id in ids:
                print(f"ERROR: missing or duplicate ID at {relative}:{line}", file=sys.stderr)
                ok = False
            ids.add(stable_id)
            url = row.get("source_url", "")
            if not url.startswith("https://") or any(ch.isspace() for ch in url):
                print(f"ERROR: invalid HTTPS source URL at {relative}:{line}", file=sys.stderr)
                ok = False
            if "source-register" in relative:
                date = row.get("publication_or_update_date", "")
                if date and not valid_date(date):
                    print(f"ERROR: invalid date at {relative}:{line}: {date}", file=sys.stderr)
                    ok = False
        if rows == 0:
            print(f"ERROR: no data rows in {relative}", file=sys.stderr)
            ok = False
        print(f"{relative}: checked {rows} data rows")
    return ok, ids

def main() -> int:
    ok = True
    for item in REQUIRED_FILES:
        if not (ROOT / item).is_file():
            print(f"ERROR: required file missing: {item}", file=sys.stderr)
            ok = False

    results = {}
    for path, columns in SCHEMAS.items():
        result, ids = check_csv(path, columns)
        results[path] = ids
        ok = result and ok

    known_sources = results.get("data/source-register.csv", set())
    indicators = ROOT / "data/indicator-snapshot.csv"
    if indicators.is_file():
        with indicators.open("r", encoding="utf-8-sig", newline="") as handle:
            for line, row in enumerate(csv.DictReader(handle), start=2):
                source_id = row.get("source_id", "")
                if source_id not in known_sources:
                    print(f"ERROR: unknown source_id {source_id} at indicator row {line}", file=sys.stderr)
                    ok = False

    readme = ROOT / "README.md"
    if readme.is_file():
        content = readme.read_text(encoding="utf-8")
        for target in re.findall(r"\]\(([^)]+)\)", content):
            if target.startswith(("https://", "http://", "#", "mailto:")):
                continue
            local = (ROOT / target.split("#", 1)[0]).resolve()
            if not local.exists():
                print(f"ERROR: broken relative link in README: {target}", file=sys.stderr)
                ok = False

    if ok:
        print("PASS: documentation, CSV schemas, IDs and README links are valid.")
        return 0
    print("FAIL: one or more validation checks failed.", file=sys.stderr)
    return 1

if __name__ == "__main__":
    raise SystemExit(main())
