#!/usr/bin/env python3
from __future__ import annotations
import hashlib,json,math,statistics,time,urllib.request,datetime
from dataclasses import dataclass,field
from pathlib import Path

SCENARIO = {
    "title": "بازسازی و راستی‌آزمایی پس از رویداد: اصابت موشک به یک ناو جنگی آمریکایی",
    "english_title": "Post-Event Public-Evidence Resilience Test: Missile Impact on a U.S. Naval Vessel",
    "purpose": "بررسی اینکه معماری Sentinel در یک سناریوی فرضیِ پس از وقوع رویداد، چگونه داده‌های عمومی، تناقض، داده ناقص/جعلی، خرابی و تغییر شرایط را مدیریت و قابل ممیزی می‌کند.",
    "scope": "تحلیل و راستی‌آزمایی پس از رویداد با داده‌های عمومی و fixtureهای مصنوعی و قطعی؛ بدون شبیه‌سازی هدایت سلاح، انتخاب هدف، مسیر حمله یا بهینه‌سازی عملیات رزمی.",
    "test_count_note": "در این suite شماره‌گذاری از 4 تا 99 است؛ بنابراین این فایل 96 آزمایش شماره‌دار را اجرا می‌کند، نه 99 آزمایش مستقل."
}

PUBLIC_CONTEXT_SOURCES = [
    {"name":"U.S. Navy Fact Files","url":"https://www.navy.mil/resources/fact-files/","role":"Official public information about U.S. Navy platforms and systems."},
    {"name":"Naval Vessel Register (NAVSEA)","url":"https://www.navsea.navy.mil/Resources/Naval-Vessel-Register/","role":"Official naval-vessel lifecycle and registry reference."},
    {"name":"NOAA Nationwide AIS","url":"https://www.fisheries.noaa.gov/inport/item/80362","role":"Public AIS metadata and vessel-data context."},
    {"name":"NOAA AIS Vessel Tracks","url":"https://www.fisheries.noaa.gov/inport/item/79504","role":"Public vessel-track dataset and limitations."},
    {"name":"ESA / Copernicus Sentinel-1 Maritime Traffic","url":"https://www.esa.int/Applications/Observing_the_Earth/Copernicus/Sentinel-1/Tracking_maritime_traffic","role":"Public SAR/AIS maritime-monitoring context."},
    {"name":"Copernicus Sentinel-1 AIS Access Discussion","url":"https://forum.dataspace.copernicus.eu/t/availability-of-sentinel-1-ais-data/4798","role":"Public discussion of Sentinel-1/AIS access limitations."},
    {"name":"NASA FIRMS","url":"https://earthdata.nasa.gov/firms","role":"Public thermal/fire observation context for after-action analysis."},
    {"name":"USNI News — USS Theodore Roosevelt Deploys From San Diego","url":"https://news.usni.org/2026/09/28/uss-theodore-roosevelt-deploys-from-san-diego-uss-abraham-lincoln-near-hawaii","role":"Current public reporting on the Sept. 27, 2026 departure and expected Middle East deployment context."}
]TEST_GROUPS = [
    ("4-10", "Analytical foundations, prediction, risk, and core integrity"),
    ("11-20", "Crisis, misinformation, incomplete data, scale, conflict, and environmental change"),
    ("21-30", "Severe and dark stress scenarios"),
    ("31-40", "Survival, inter-layer dependency, memory, knowledge, learning, and recovery"),
    ("41-45", "Security, attack-resistance fixtures, and anti-collapse controls"),
    ("46-60", "Decision quality, analytical error, data bias, transparency, audit, and compliance"),
    ("61-70", "Ethics, coordination, cumulative error, resources, and human review"),
    ("71-85", "Ecosystem adaptation, layer persistence, system integrity, maturity, and readiness"),
    ("86-90", "Issue extraction, correction validation, post-correction stability, and regression prevention"),
    ("91-99", "Final coordination, maximum-load resilience, unknown scenarios, generalization, and final validation")
]
