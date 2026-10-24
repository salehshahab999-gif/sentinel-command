#!/usr/bin/env python3
"""Download full-resolution public Wikimedia Commons originals using its official API.

Run from the Sentinel Command repository root:
  python scripts/download_vatican_commons_originals.py
Optional:
  python scripts/download_vatican_commons_originals.py --out-dir data/vatican/originals

The script resolves the canonical source URL and metadata first, downloads the
original file (not a thumbnail), and records size and SHA-256 in a manifest.
It does not bypass access controls and does not overwrite existing files.
"""
import argparse
import hashlib
import json
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

API = "https://commons.wikimedia.org/w/api.php"
USER_AGENT = "SentinelCommandHistoricalImageryResearch/1.0 (public archive research)"
FILES = [
    "ETH-BIB-Petersdom und Vatikan in Rom-Mittelmeerflug 1928-LBS MH02-04-0190.tif",
    "ETH-BIB-Petersdom in Rom-Mittelmeerflug 1928-LBS MH02-04-0191.tif",
    "ETH-BIB-Vatikan, Rom-Kilimanjaroflug 1929-30-LBS MH02-07-0403.tif",
    "ETH-BIB-Vatikan, Rom-Kilimanjaroflug 1929-30-LBS MH02-07-0404.tif",
    "ETH-BIB-Vatikan, Rom-Kilimanjaroflug 1929-30-LBS MH02-07-0405.tif",
]

def get_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=60) as response:
        return json.loads(response.read().decode("utf-8"))

def sha256(path):
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--out-dir", default="data/vatican/originals")
    parser.add_argument("--pause", type=float, default=1.0)
    args = parser.parse_args()
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    manifest_path = out_dir / "download-manifest.json"
    manifest = {"source": "Wikimedia Commons API", "items": []}
    if manifest_path.exists():
        try:
            manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            print("WARNING: existing manifest could not be read; starting a new manifest")
    known = {item.get("title"): item for item in manifest.get("items", [])}
    failures = 0
    for title in FILES:
        print("\nResolving:", title)
        params = urllib.parse.urlencode({
            "action": "query", "format": "json", "formatversion": "2",
            "titles": "File:" + title, "prop": "imageinfo",
            "iiprop": "url|size|sha1|mime|extmetadata",
        })
        try:
            payload = get_json(API + "?" + params)
            pages = payload.get("query", {}).get("pages", [])
            if not pages or pages[0].get("missing") or not pages[0].get("imageinfo"):
                raise RuntimeError("Commons API did not return this file; title may be incorrect")
            page = pages[0]
            info = page["imageinfo"][0]
            original_url = info["url"]
            filename = Path(urllib.parse.unquote(urllib.parse.urlparse(original_url).path)).name
            destination = out_dir / filename
            page_title = page.get("title", "File:" + title)
            record = {
                "title": page_title,
                "description_page": "https://commons.wikimedia.org/wiki/" + urllib.parse.quote(page_title.replace(" ", "_"), safe=":/()_,.-"),
                "source_url": original_url,
                "expected_bytes": info.get("size"),
                "commons_sha1": info.get("sha1"),
                "mime": info.get("mime"),
                "license": info.get("extmetadata", {}).get("LicenseShortName", {}).get("value"),
                "status": "pending",
            }
            if destination.exists():
                record.update({"status": "already_exists_not_overwritten", "local_bytes": destination.stat().st_size, "sha256": sha256(destination)})
                print("Already exists; preserving:", destination)
            else:
                print("Original URL:", original_url)
                print("Expected size (bytes):", info.get("size"))
                req = urllib.request.Request(original_url, headers={"User-Agent": USER_AGENT})
                temp = destination.with_suffix(destination.suffix + ".part")
                try:
                    with urllib.request.urlopen(req, timeout=180) as response, temp.open("wb") as out:
                        while True:
                            chunk = response.read(1024 * 1024)
                            if not chunk:
                                break
                            out.write(chunk)
                    actual = temp.stat().st_size
                    if info.get("size") is not None and actual != int(info["size"]):
                        raise RuntimeError("Downloaded byte count differs from Commons metadata")
                    temp.replace(destination)
                    record.update({"status": "downloaded", "local_bytes": actual, "sha256": sha256(destination)})
                    print("Downloaded and verified byte count:", actual)
                except Exception:
                    if temp.exists():
                        temp.unlink()
                    raise
            known[page_title] = record
        except Exception as exc:
            failures += 1
            print("FAILED:", repr(exc))
            known[title] = {"title": title, "status": "failed", "error": str(exc)}
        manifest["items"] = list(known.values())
        manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
        time.sleep(max(0.0, args.pause))
    print("\nManifest:", manifest_path)
    print("Successful/already present:", sum(1 for item in known.values() if item.get("status") in ("downloaded", "already_exists_not_overwritten")))
    print("Failed:", failures)
    return 1 if failures else 0

if __name__ == "__main__":
    raise SystemExit(main())
