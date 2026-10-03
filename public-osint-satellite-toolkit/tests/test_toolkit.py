from datetime import datetime, timezone

from src.osint_satellite_toolkit import (
    Coordinate,
    bounding_box,
    deduplicate_sources,
    haversine_km,
    initial_bearing_deg,
    make_evidence,
    solar_position,
)


def test_haversine_zero():
    point = Coordinate(0.0, 0.0)
    assert haversine_km(point, point) == 0.0


def test_bearing_north():
    a = Coordinate(0.0, 0.0)
    b = Coordinate(1.0, 0.0)
    assert 0.0 <= initial_bearing_deg(a, b) <= 1.0


def test_bounding_box():
    values = [
        Coordinate(10.0, 20.0),
        Coordinate(12.0, 25.0),
        Coordinate(11.0, 22.0),
    ]
    assert bounding_box(values) == (10.0, 20.0, 12.0, 25.0)


def test_deduplication_keeps_unique_sources():
    a = make_evidence(
        "a",
        "OBSERVED_FACT",
        "source-a",
        "https://example.org/a",
        "image",
        True,
        observed_at=datetime.now(timezone.utc),
    )
    b = make_evidence(
        "b",
        "OBSERVED_FACT",
        "source-a",
        "https://example.org/a",
        "image",
        True,
    )
    c = make_evidence(
        "c",
        "SOURCE_CLAIM",
        "source-b",
        "https://example.org/b",
        "article",
        False,
    )

    result = deduplicate_sources([a, b, c])
    assert len(result) == 2


def test_solar_position_returns_valid_angles():
    azimuth, elevation = solar_position(
        35.0,
        51.0,
        datetime(2026, 6, 21, 12, tzinfo=timezone.utc),
    )
    assert 0.0 <= azimuth < 360.0
    assert -90.0 <= elevation <= 90.0
