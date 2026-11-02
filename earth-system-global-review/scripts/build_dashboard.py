#!/usr/bin/env python3
"""Build the visual dashboard and annual comparison from verified CSV inputs.

Standard-library only. Does not fetch external data and never invents missing values.
"""
from __future__ import annotations

import argparse
import csv
import html
import math
from collections import defaultdict
from datetime import date
from pathlib import Path

EARTH = Path(__file__).resolve().parents[1]
REPO = EARTH.parent
INDICATORS = EARTH / "data" / "indicator-snapshot.csv"
ANNUAL = EARTH / "data" / "annual-observations.csv"
ASSET = EARTH / "assets" / "earth-system-dashboard.svg"
ANNUAL_MD = REPO / "EARTH-SYSTEM-ANNUAL-COMPARISON.md"
REPORT = REPO / "Global-Earth-System-Complete-Report.md"
START = "<!-- AUTO-ANNUAL-START -->"
END = "<!-- AUTO-ANNUAL-END -->"


def read_rows(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def number(value: str) -> float | None:
    try:
        result = float(value)
    except (TypeError, ValueError):
        return None
    return result if math.isfinite(result) else None


def fmt(value: float, places: int = 2) -> str:
    text = f"{value:,.{places}f}"
    return text.rstrip("0").rstrip(".") if "." in text else text


def signed(value: float, places: int = 2) -> str:
    if value > 0:
        return "+" + fmt(value, places)
    if value < 0:
        return "−" + fmt(abs(value), places)
    return fmt(0, places)


def compatible(a: dict[str, str], b: dict[str, str]) -> bool:
    keys = (
        "unit",
        "reference_baseline",
        "geographic_scope",
        "method_key",
        "comparison_window",
        "comparison_type",
    )
    return all((a.get(k) or "") == (b.get(k) or "") for k in keys)


def comparisons(rows: list[dict[str, str]]) -> tuple[list[dict[str, object]], list[dict[str, str]]]:
    groups: dict[str, list[dict[str, str]]] = defaultdict(list)
    for row in rows:
        groups[row["series_id"]].append(row)

    pairs: list[dict[str, object]] = []
    waiting: list[dict[str, str]] = []
    for series_id, values in sorted(groups.items()):
        values.sort(key=lambda r: int(r["year"]))
        pair = None
        for older, newer in zip(values, values[1:]):
            y0, y1 = int(older["year"]), int(newer["year"])
            if y1 == y0 + 1 and compatible(older, newer):
                x0, x1 = number(older["value"]), number(newer["value"])
                if x0 is not None and x1 is not None:
                    delta = x1 - x0
                    if newer.get("reported_yoy_percent"):
                        relative = f'{signed(float(newer["reported_yoy_percent"]), 1)}% (source-reported)'
                    elif newer["comparison_type"] == "absolute_and_percent" and x0 != 0:
                        relative = f'{signed((delta / abs(x0)) * 100, 2)}% (calculated from displayed values)'
                    else:
                        relative = "Not meaningful for this metric"
                    pair = {
                        "series_id": series_id,
                        "name": newer["indicator_name"],
                        "older": older,
                        "newer": newer,
                        "delta": delta,
                        "relative": relative,
                    }
        if pair:
            pairs.append(pair)
        else:
            waiting.append(values[-1])
    return pairs, waiting


def source_link(row: dict[str, str]) -> str:
    url = html.escape(row.get("source_url", ""), quote=True)
    source_id = html.escape(row.get("source_id", "source"))
    return f'[{source_id}]({url})' if url else source_id


def annual_markdown(rows: list[dict[str, str]]) -> str:
    pairs, waiting = comparisons(rows)
    current_years = sorted({int(r["year"]) for r in rows})
    generated = date.today().isoformat()
    lines = [
        "# 🌍 Annual Earth-System Comparison",
        "",
        f"**Generated:** {generated}  ",
        f"**Annual data years currently stored:** {current_years[0]}–{current_years[-1]}  ",
        "**Rule:** compare adjacent years only when unit, baseline, geographic scope, method and observation window match.",
        "",
        "> [!IMPORTANT]",
        "> This is a source-backed year-to-year comparison, not a forecast and not a live sensor feed. A one-year change does not replace a multi-decadal trend. Missing or incompatible values remain un-compared.",
        "",
        "## 📊 Comparable year-over-year results",
        "",
    ]
    if pairs:
        lines.extend([
            "| Indicator | Earlier year | Latest year | Absolute change | Relative change | Evidence |",
            "|---|---:|---:|---:|---:|---|",
        ])
        for pair in pairs:
            older = pair["older"]
            newer = pair["newer"]
            assert isinstance(older, dict) and isinstance(newer, dict)
            delta = float(pair["delta"])
            unit = newer["unit"]
            places = 2 if unit == "degC" else (1 if unit in {"ppm", "ppb", "GtCO2", "mm", "ZJ"} else 2)
            lines.append(
                f'| {pair["name"]} | {older["year"]}: {older["value"]} {unit} | '
                f'{newer["year"]}: {newer["value"]} {unit} | {signed(delta, places)} {unit} | '
                f'{pair["relative"]} | {source_link(newer)} |'
            )
    else:
        lines.append("No adjacent-year series currently meet the comparison rules.")
    lines.extend([
        "",
        "## 🧭 Interpretation notes",
        "",
        "- **Global temperature:** compare annual anomalies against the same 1850–1900 reference. The 2024-to-2025 change is annual variability; it is not evidence that the multi-decadal warming trend reversed.",
        "- **Greenhouse gases:** concentrations are atmospheric stock measurements, not annual emissions. Their year-to-year change is shown separately from emissions.",
        "- **Fossil CO₂:** the Global Carbon Budget's published 2025 growth estimate is shown as source-reported. Displayed values are rounded, so recomputing a percentage from 37.8 and 38.1 GtCO₂ would not reproduce the source's reported +1.0%.",
        "- **Regional anomalies:** country-specific normals remain separate from the global 1850–1900 series.",
        "- **Sea ice:** NASA/NSIDC and NIPR products are separate methods. They are never averaged or substituted for one another.",
        "- **Percentage change:** used only where it is meaningful and permitted by the metric record. Temperature anomalies and precipitation departures use absolute changes instead.",
        "",
        "## ⏳ Series awaiting the next comparable year",
        "",
    ])
    if waiting:
        lines.extend([
            "| Series | Latest stored year | Latest value | Why no year-to-year result is shown | Source |",
            "|---|---:|---:|---|---|",
        ])
        for row in waiting:
            lines.append(
                f'| {row["indicator_name"]} | {row["year"]} | {row["value"]} {row["unit"]} | '
                f'No adjacent year with matching method/window yet | {source_link(row)} |'
            )
    else:
        lines.append("All stored series have an adjacent-year comparison.")
    lines.extend([
        "",
        "## 🔁 Annual update cycle",
        "",
        "GitHub Actions opens an annual review issue on 15 April (08:23 UTC) to request the previous complete calendar year's authoritative datasets. Maintainers or AI-assisted researchers must verify each primary source, add the new year to the annual-observations.csv file, and update the indicator/source registers. The dashboard and this comparison are then rebuilt automatically.",
        "",
        "The scheduled issue is a review trigger, not an automatic claim that the newest year's scientific reports have all been released. Publication windows differ by institution.",
        "",
        "## 🧾 Data and method",
        "",
        "- Machine-readable values: [annual-observations.csv](earth-system-global-review/data/annual-observations.csv)",
        "- Current indicator snapshot: [indicator-snapshot.csv](earth-system-global-review/data/indicator-snapshot.csv)",
        "- Source registry: [source-register.csv](earth-system-global-review/data/source-register.csv)",
        "- Reproducible builder: [build_dashboard.py](earth-system-global-review/scripts/build_dashboard.py)",
        "- Workflow: [Earth System annual review](.github/workflows/earth-system-annual-review.yml)",
        "",
        "Generated from repository data only. No web scraping, missing-value interpolation or unverified number insertion is performed by this script.",
        "",
    ])
    return "\n".join(lines)


def lookup(indicators: list[dict[str, str]], indicator_id: str) -> dict[str, str]:
    for row in indicators:
        if row["indicator_id"] == indicator_id:
            return row
    raise ValueError(f"Missing dashboard indicator: {indicator_id}")


def annual_delta_map(rows: list[dict[str, str]]) -> dict[str, dict[str, object]]:
    pairs, _ = comparisons(rows)
    return {str(p["series_id"]): p for p in pairs}


def svg_dashboard(indicators: list[dict[str, str]], annual_rows: list[dict[str, str]]) -> str:
    by_id = {r["indicator_id"]: r for r in indicators}
    delta = annual_delta_map(annual_rows)

    def item(key: str) -> dict[str, str]:
        if key not in by_id:
            raise ValueError(f"Missing dashboard indicator {key}")
        return by_id[key]

    palette = {
        "background": "#0b1220",
        "panel": "#121f33",
        "panel2": "#172942",
        "border": "#29415e",
        "text": "#f4f7fb",
        "muted": "#a8bbcf",
        "cyan": "#57d3e5",
        "green": "#70d6a5",
        "amber": "#f5c56b",
        "track": "#263d57",
    }
    width, height = 1200, 900
    out = [
        f'<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="title desc" viewBox="0 0 {width} {height}" width="{width}" height="{height}">',
        '<title id="title">Global Earth System visual dashboard</title>',
        '<desc id="desc">A visual summary of global temperature, greenhouse gases, sea level, sea ice, glaciers, ocean heat, seafloor mapping and spatial-reference rules.</desc>',
        f'<rect width="{width}" height="{height}" rx="28" fill="{palette["background"]}"/>',
        f'<path d="M0 120 H1200" stroke="{palette["border"]}" stroke-width="2"/>',
        f'<text x="42" y="54" fill="{palette["text"]}" font-family="Inter,Arial,sans-serif" font-size="30" font-weight="700">GLOBAL EARTH SYSTEM</text>',
        f'<text x="44" y="88" fill="{palette["muted"]}" font-family="Inter,Arial,sans-serif" font-size="16">VISUAL RESEARCH DASHBOARD  •  SNAPSHOT: {date.today().strftime('%d %b %Y').upper()}</text>',
        f'<rect x="902" y="32" width="250" height="52" rx="15" fill="{palette["panel2"]}" stroke="{palette["border"]}"/>',
        f'<text x="1027" y="64" text-anchor="middle" fill="{palette["cyan"]}" font-family="Inter,Arial,sans-serif" font-size="15" font-weight="700">SOURCE-TRACEABLE • NOT LIVE</text>',
    ]

    specs = [
        ("THERMOMETER", "GLOBAL TEMPERATURE", "CLIM-001", 0.0, 2.0, "1850–1900 reference", "GLOBAL_TEMP_WMO"),
        ("CO₂", "ATMOSPHERIC CO₂", "GHG-001", 280.0, 460.0, "WMO annual mean", "CO2_WMO_GAW"),
        ("SEA LEVEL", "GLOBAL SEA LEVEL", "OCEAN-003", 0.0, 150.0, "1993 reference", "NASA_SEA_LEVEL_OCTOBER"),
        ("MAP", "SEAFLOOR MAPPED", "EARTH-001", 0.0, 100.0, "Modern-standard coverage", "GEBCO_MAPPING_COVERAGE"),
        ("ARCTIC ICE", "ARCTIC SEA-ICE MINIMUM", "ICE-001", None, None, "NASA / NSIDC product", "ARCTIC_MIN_NSIDC"),
        ("ANTARCTIC ICE", "ANTARCTIC SEA-ICE MAXIMUM", "ICE-005", None, None, "NASA / NSIDC product", "ANTARCTIC_MAX_NSIDC"),
        ("GLACIERS", "MOUNTAIN GLACIER MASS", "ICE-009", None, None, "2025 hydrological year", "MOUNTAIN_GLACIER_MASS_BALANCE"),
        ("OCEAN HEAT", "OCEAN HEAT CHANGE", "OCEAN-001", None, None, "Full-depth • 2024–2025", "GLOBAL_OCEAN_HEAT_CHANGE"),
        ("COORDINATES", "GEO-SPATIAL READOUT", None, None, None, "Location-aware records", None),
    ]
    card_w, card_h = 356, 190
    xs, ys = [38, 422, 806], [142, 350, 558]

    def txt(x: float, y: float, value: str, size: int, color: str, weight: str = "400", anchor: str = "start") -> None:
        out.append(f'<text x="{x}" y="{y}" text-anchor="{anchor}" fill="{color}" font-family="Inter,Arial,sans-serif" font-size="{size}" font-weight="{weight}">{html.escape(value)}</text>')

    for index, (icon, title, iid, lo, hi, caption, series) in enumerate(specs):
        col, row = index % 3, index // 3
        x, y = xs[col], ys[row]
        out.append(f'<rect x="{x}" y="{y}" width="{card_w}" height="{card_h}" rx="20" fill="{palette["panel"]}" stroke="{palette["border"]}" stroke-width="1.5"/>')
        txt(x + 20, y + 34, f"{icon}  {title}", 14, palette["muted"], "700")
        if iid is None:
            txt(x + 20, y + 82, "LAT / LON / CRS / Z", 22, palette["cyan"], "700")
            txt(x + 20, y + 113, "Coordinates belong to a station, event or grid cell.", 12, palette["text"])
            txt(x + 20, y + 139, "Global means are areas/grids, not one point.", 12, palette["text"])
            txt(x + 20, y + 166, "Record datum, elevation/depth and uncertainty.", 11, palette["muted"])
            continue

        row_data = item(iid)
        raw = row_data["value"]
        v = number(raw)
        if iid == "CLIM-001":
            value_text = f"+{raw} °C"
        elif row_data["unit"] == "percent":
            value_text = f"{raw}%"
        elif row_data["unit"] == "million_km2":
            value_text = f"{raw} million km²"
        elif row_data["unit"] == "Gt":
            value_text = f"−{raw.lstrip('-')} Gt"
        elif row_data["unit"] == "ZJ":
            value_text = f"+{raw} ± 6 ZJ"
        else:
            value_text = f"{raw} {row_data['unit']}"
        txt(x + 20, y + 82, value_text, 29, palette["text"], "700")
        txt(x + 20, y + 108, caption, 12, palette["muted"])

        pair = delta.get(series or "")
        if pair:
            d = float(pair["delta"])
            suffix = row_data["unit"]
            if iid == "CLIM-001":
                delta_text = f'2024 → 2025: {signed(d, 2)} °C'
            elif iid == "GHG-001":
                delta_text = f'2024 → 2025: {signed(d, 1)} ppm'
            else:
                delta_text = f'2024 → 2025: {signed(d, 2)} {suffix}'
            txt(x + 20, y + 132, delta_text, 12, palette["green"] if d > 0 else palette["amber"], "700")
        else:
            txt(x + 20, y + 132, f'Source: {row_data["source_id"]}', 11, palette["muted"])

        if lo is not None and hi is not None and v is not None:
            pct = max(0.0, min(1.0, (v - lo) / (hi - lo)))
            gx, gy, gw = x + 20, y + 151, card_w - 40, 9
            out.append(f'<rect x="{gx}" y="{gy}" width="{gw}" height="9" rx="4.5" fill="{palette["track"]}"/>')
            out.append(f'<rect x="{gx}" y="{gy}" width="{gw*pct:.1f}" height="9" rx="4.5" fill="{palette["cyan"]}"/>')
            txt(gx, y + 178, f"DISPLAY SCALE {fmt(lo,0)}–{fmt(hi,0)} {row_data['unit']} • NOT A RISK THRESHOLD", 8, palette["muted"])
        else:
            txt(x + 20, y + 165, f'Period: {row_data["period"]}', 10, palette["muted"])

    out.extend([
        f'<rect x="38" y="774" width="1124" height="88" rx="18" fill="{palette["panel2"]}" stroke="{palette["border"]}"/>',
        f'<text x="60" y="806" fill="{palette["cyan"]}" font-family="Inter,Arial,sans-serif" font-size="14" font-weight="700">ANNUAL COMPARISON ENGINE</text>',
        f'<text x="60" y="834" fill="{palette["text"]}" font-family="Inter,Arial,sans-serif" font-size="14">2024 → 2025 pairs: global temperature, CO₂, CH₄, N₂O and fossil CO₂.</text>',
        f'<text x="60" y="854" fill="{palette["muted"]}" font-family="Inter,Arial,sans-serif" font-size="11">Future values compare only when method, unit, baseline, geography and observation window match.</text>',
        '</svg>',
    ])
    return "\n".join(out) + "\n"


def replace_block(report: str, block: str) -> str:
    if START not in report or END not in report:
        raise ValueError(f"Report must contain {START} and {END} markers")
    before, remainder = report.split(START, 1)
    _, after = remainder.split(END, 1)
    return before + START + "\n\n" + block.strip() + "\n\n" + END + after


def write_or_check(path: Path, content: str, check: bool) -> bool:
    if check:
        if not path.is_file() or path.read_text(encoding="utf-8") != content:
            print(f"STALE: {path.relative_to(REPO)}")
            return False
        print(f"OK: {path.relative_to(REPO)}")
        return True
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8", newline="\n")
    print(f"WROTE: {path.relative_to(REPO)}")
    return True


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="verify generated outputs without writing")
    args = parser.parse_args()

    indicator_rows = read_rows(INDICATORS)
    annual_rows = read_rows(ANNUAL)
    annual = annual_markdown(annual_rows)
    image = svg_dashboard(indicator_rows, annual_rows)
    report_text = REPORT.read_text(encoding="utf-8")
    embedded_annual = annual.replace("# 🌍 Annual Earth-System Comparison", "### 📊 Annual year-over-year results", 1)
    embedded_annual = embedded_annual.replace("\n## ", "\n#### ")
    updated_report = replace_block(report_text, embedded_annual)

    ok = True
    for path, content in ((ASSET, image), (ANNUAL_MD, annual), (REPORT, updated_report)):
        ok = write_or_check(path, content, args.check) and ok
    if not ok:
        print("Generated outputs are stale. Run: python earth-system-global-review/scripts/build_dashboard.py")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
