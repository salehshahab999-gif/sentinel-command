"""
Generic public OSINT + satellite-analysis utilities.

No target-specific coordinates are embedded here.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from math import atan2, cos, degrees, radians, sin, sqrt
from typing import Iterable, Optional

EARTH_RADIUS_KM = 6371.0088


@dataclass(frozen=True)
class Coordinate:
    latitude: float
    longitude: float


@dataclass(frozen=True)
class Evidence:
    evidence_id: str
    classification: str
    source: str
    url: str
    observed_at: Optional[str]
    data_type: str
    independent: bool
    coordinate: Optional[Coordinate]
    uncertainty_m: Optional[float]
    note: str = ""

    def to_dict(self) -> dict:
        value = asdict(self)
        if self.coordinate is not None:
            value["coordinate"] = asdict(self.coordinate)
        return value


def validate_coordinate(point: Coordinate) -> None:
    if not -90 <= point.latitude <= 90:
        raise ValueError("Latitude must be between -90 and 90 degrees.")
    if not -180 <= point.longitude <= 180:
        raise ValueError("Longitude must be between -180 and 180 degrees.")


def haversine_km(a: Coordinate, b: Coordinate) -> float:
    validate_coordinate(a)
    validate_coordinate(b)

    lat1, lat2 = radians(a.latitude), radians(b.latitude)
    dlat = radians(b.latitude - a.latitude)
    dlon = radians(b.longitude - a.longitude)

    h = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    return 2 * EARTH_RADIUS_KM * atan2(sqrt(h), sqrt(max(0.0, 1 - h)))


def initial_bearing_deg(a: Coordinate, b: Coordinate) -> float:
    validate_coordinate(a)
    validate_coordinate(b)

    lat1 = radians(a.latitude)
    lat2 = radians(b.latitude)
    dlon = radians(b.longitude - a.longitude)

    x = sin(dlon) * cos(lat2)
    y = cos(lat1) * sin(lat2) - sin(lat1) * cos(lat2) * cos(dlon)

    return (degrees(atan2(x, y)) + 360) % 360


def solar_position(
    latitude_deg: float,
    longitude_deg: float,
    when: datetime,
) -> tuple[float, float]:
    """
    Approximate solar azimuth and elevation.

    This lightweight approximation is intended for consistency checks,
    not astronomical-grade ephemeris.
    """
    if when.tzinfo is None:
        when = when.replace(tzinfo=timezone.utc)
    when_utc = when.astimezone(timezone.utc)

    n = when_utc.timetuple().tm_yday
    hour = when_utc.hour + when_utc.minute / 60 + when_utc.second / 3600

    decl = radians(23.44 * sin(radians((360 / 365) * (n - 81))))
    utc_offset_hours = longitude_deg / 15.0
    solar_time = hour + utc_offset_hours
    hour_angle = radians(15 * (solar_time - 12))

    lat = radians(latitude_deg)
    elevation = degrees(
        __import__("math").asin(
            sin(lat) * sin(decl)
            + cos(lat) * cos(decl) * cos(hour_angle)
        )
    )

    azimuth = (
        degrees(
            atan2(
                sin(hour_angle),
                cos(hour_angle) * sin(lat) - __import__("math").tan(decl) * cos(lat),
            )
        )
        + 180
    ) % 360

    return azimuth, elevation


def deduplicate_sources(records: Iterable[Evidence]) -> list[Evidence]:
    """
    Remove exact duplicates by source URL + evidence type.
    Reposts from different URLs are NOT automatically independent.
    """
    seen: set[tuple[str, str]] = set()
    output: list[Evidence] = []

    for record in records:
        key = (record.url.strip(), record.data_type.strip().lower())
        if key in seen:
            continue
        seen.add(key)
        output.append(record)

    return output


def independent_count(records: Iterable[Evidence]) -> int:
    return sum(1 for item in records if item.independent)


def bounding_box(points: Iterable[Coordinate]) -> tuple[float, float, float, float]:
    values = list(points)
    if not values:
        raise ValueError("At least one coordinate is required.")

    for point in values:
        validate_coordinate(point)

    lats = [p.latitude for p in values]
    lons = [p.longitude for p in values]
    return min(lats), min(lons), max(lats), max(lons)


def make_evidence(
    evidence_id: str,
    classification: str,
    source: str,
    url: str,
    data_type: str,
    independent: bool,
    coordinate: Optional[Coordinate] = None,
    uncertainty_m: Optional[float] = None,
    observed_at: Optional[datetime] = None,
    note: str = "",
) -> Evidence:
    timestamp = None
    if observed_at is not None:
        if observed_at.tzinfo is None:
            observed_at = observed_at.replace(tzinfo=timezone.utc)
        timestamp = observed_at.isoformat()

    return Evidence(
        evidence_id=evidence_id,
        classification=classification,
        source=source,
        url=url,
        observed_at=timestamp,
        data_type=data_type,
        independent=independent,
        coordinate=coordinate,
        uncertainty_m=uncertainty_m,
        note=note,
    )


__all__ = [
    "Coordinate",
    "Evidence",
    "bounding_box",
    "deduplicate_sources",
    "haversine_km",
    "independent_count",
    "initial_bearing_deg",
    "make_evidence",
    "solar_position",
    "validate_coordinate",
]
