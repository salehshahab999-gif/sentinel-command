#!/usr/bin/env python3
"""Validate Global Earth System reports, source registers and annual comparison data.

Uses only the Python standard library. No network access and no third-party packages.
"""
from __future__ import annotations

import csv
import re
import sys
import xml.etree.ElementTree as ET
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parent
REQUIRED_FILES = [
    "README.md", "EXECUTIVE-ASSESSMENT.md",
    "CLIMATE-CRYOSPHERE-ATMOSPHERE.md", "SOLID-EARTH-INTERIOR-TECTONICS.md",
    "VOLCANOES-SUBMARINE-VOLCANISM.md", "GLOBAL-SEISMOLOGY.md",
    "OCEAN-FLOOR-AND-MARINE-OBSERVING.md", "PALEO-EARTH-AND-DEEP-TIME.md",
    "CROSS-COUNTRY-SOURCE-RECONCILIATION.md", "SOURCE-CATALOG.md",
    "METHODS-UNCERTAINTY-AND-REPRODUCIBILITY.md", "ROADMAP-AND-CONTRIBUTING.md",
    "GLOSSARY.md", "CHANGELOG.md", "CITATION.cff",
    "data/indicator-snapshot.csv", "data/source-register.csv",
    "data/annual-observations.csv", "data/README.md", "LICENSE.txt",
    "scripts/validate.py", "scripts/build_dashboard.py",
    "scripts/open_annual_review.py", "assets/earth-system-dashboard.svg",
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
    "data/annual-observations.csv": [
        "series_id", "year", "indicator_name", "value", "unit",
        "reference_baseline", "geographic_scope", "method_key",
        "comparison_window", "comparison_type", "period", "source_id",
        "source_url", "publication_date", "uncertainty", "evidence_class",
        "reported_yoy_percent", "notes",
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


def check_csv(relative: str, columns: list[str]) -> tuple[bool, set[str], list[dict[str, str]]]:
    path = ROOT / relative
    if not path.is_file():
        print(f"ERROR: missing {relative}", file=sys.stderr)
        return False, set(), []
    ok = True
    ids: set[str] = set()
    rows_out: list[dict[str, str]] = []
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        if reader.fieldnames != columns:
            print(f"ERROR: schema mismatch in {relative}", file=sys.stderr)
            return False, set(), []
        rows = 0
        for line, row in enumerate(reader, start=2):
            rows += 1
            if "series_id" in row:
                stable_id = f'{row.get("series_id", "")}:{row.get("year", "")}'
            else:
                stable_id = row.get("indicator_id") or row.get("source_id") or ""
            if not stable_id or stable_id in ids:
                print(f"ERROR: missing or duplicate ID at {relative}:{line}", file=sys.stderr)
                ok = False
            ids.add(stable_id)
            url = row.get("source_url", "")
            parts = urlsplit(url)
            if parts.scheme != "https" or not parts.netloc or any(ch.isspace() for ch in url):
                print(f"ERROR: invalid HTTPS source URL at {relative}:{line}", file=sys.stderr)
                ok = False
            if "source-register" in relative:
                published = row.get("publication_or_update_date", "")
                if published and not valid_date(published):
                    print(f"ERROR: invalid publication date at {relative}:{line}: {published}", file=sys.stderr)
                    ok = False
            if "annual-observations" in relative:
                year = row.get("year", "")
                if not re.fullmatch(r"\d{4}", year):
                    print(f"ERROR: invalid observation year at {relative}:{line}", file=sys.stderr)
                    ok = False
                try:
                    float(row.get("value", ""))
                except ValueError:
                    print(f"ERROR: non-numeric annual value at {relative}:{line}", file=sys.stderr)
                    ok = False
                if row.get("comparison_type") not in {"absolute_only", "absolute_and_percent"}:
                    print(f"ERROR: invalid comparison_type at {relative}:{line}", file=sys.stderr)
                    ok = False
                if row.get("publication_date") and not valid_date(row["publication_date"]):
                    print(f"ERROR: invalid annual publication_date at {relative}:{line}", file=sys.stderr)
                    ok = False
                required = ("series_id", "indicator_name", "unit", "reference_baseline",
                            "geographic_scope", "method_key", "comparison_window", "source_id")
                if any(not row.get(k) for k in required):
                    print(f"ERROR: incomplete annual metadata at {relative}:{line}", file=sys.stderr)
                    ok = False
            rows_out.append(row)
        if rows == 0:
            print(f"ERROR: no data rows in {relative}", file=sys.stderr)
            ok = False
        print(f"{relative}: checked {rows} data rows")
    return ok, ids, rows_out


def check_links(markdown_path: Path) -> bool:
    if not markdown_path.is_file():
        print(f"ERROR: missing Markdown file {markdown_path}", file=sys.stderr)
        return False
    ok = True
    content = markdown_path.read_text(encoding="utf-8")
    in_fence = False
    for line_number, line in enumerate(content.splitlines(), start=1):
        if re.match(r"^\s*(?:\x60{3}|~~~)", line):
            in_fence = not in_fence
            continue
        if in_fence:
            continue
        for target in re.findall(r"\]\(([^)]+)\)", line):
            target = target.strip().strip("<>")
            if target.startswith(("https://", "http://", "mailto:", "tel:", "#", "//")):
                continue
            target = target.split("#", 1)[0].split("?", 1)[0]
            if not target:
                continue
            local = (markdown_path.parent / target).resolve()
            if not local.exists():
                print(f"ERROR: broken local link in {markdown_path.relative_to(REPO)}:{line_number}: {target}", file=sys.stderr)
                ok = False
    return ok


def main() -> int:
    ok = True
    for item in REQUIRED_FILES:
        if not (ROOT / item).is_file():
            print(f"ERROR: required file missing: {item}", file=sys.stderr)
            ok = False
    for path in ("Global-Earth-System-Complete-Report.md", "EARTH-SYSTEM-ANNUAL-COMPARISON.md"):
        if not (REPO / path).is_file():
            print(f"ERROR: missing root-level generated file: {path}", file=sys.stderr)
            ok = False

    results: dict[str, set[str]] = {}
    rows: dict[str, list[dict[str, str]]] = {}
    for path, columns in SCHEMAS.items():
        result, ids, data_rows = check_csv(path, columns)
        results[path] = ids
        rows[path] = data_rows
        ok = result and ok

    known_sources = results.get("data/source-register.csv", set())
    for path in ("data/indicator-snapshot.csv", "data/annual-observations.csv"):
        for line, row in enumerate(rows.get(path, []), start=2):
            source_id = row.get("source_id", "")
            if source_id not in known_sources:
                print(f"ERROR: unknown source_id {source_id} at {path}:{line}", file=sys.stderr)
                ok = False

    by_series: dict[str, list[dict[str, str]]] = defaultdict(list)
    for row in rows.get("data/annual-observations.csv", []):
        by_series[row["series_id"]].append(row)
    for series, series_rows in by_series.items():
        series_rows.sort(key=lambda r: int(r["year"]))
        for a, b in zip(series_rows, series_rows[1:]):
            if int(b["year"]) == int(a["year"]) + 1:
                for field in ("unit", "reference_baseline", "geographic_scope",
                              "method_key", "comparison_window", "comparison_type"):
                    if a[field] != b[field]:
                        print(f"ERROR: incompatible adjacent-year metadata in {series}: {field}", file=sys.stderr)
                        ok = False

    report = REPO / "Global-Earth-System-Complete-Report.md"
    annual_md = REPO / "EARTH-SYSTEM-ANNUAL-COMPARISON.md"
    if report.is_file():
        body = report.read_text(encoding="utf-8")
        if body.count("<!-- AUTO-ANNUAL-START -->") != 1 or body.count("<!-- AUTO-ANNUAL-END -->") != 1:
            print("ERROR: annual comparison markers must appear exactly once in the single-page report", file=sys.stderr)
            ok = False
        if "earth-system-global-review/assets/earth-system-dashboard.svg" not in body:
            print("ERROR: single-page report does not link the dashboard SVG", file=sys.stderr)
            ok = False
    svg = ROOT / "assets" / "earth-system-dashboard.svg"
    if svg.is_file():
        try:
            ET.parse(svg)
        except ET.ParseError as exc:
            print(f"ERROR: invalid dashboard SVG: {exc}", file=sys.stderr)
            ok = False

    for markdown in (
        REPO / "README.md",
        REPO / "PUBLIC-RESEARCH-ARCHIVE.md",
        REPO / "AI-RESEARCH-GUIDE.md",
        report,
        annual_md,
        ROOT / "README.md",
    ):
        ok = check_links(markdown) and ok

    if ok:
        print(f"PASS: reports, dashboard, {len(rows.get('data/indicator-snapshot.csv', []))} indicators, "
              f"{len(rows.get('data/source-register.csv', []))} sources and "
              f"{len(rows.get('data/annual-observations.csv', []))} annual observations are valid.")
        return 0
    print("FAIL: one or more research validation checks failed.", file=sys.stderr)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
