#!/usr/bin/env python3
"""
One-off fetch: pull the 10 Regional IPI level series from CEIC into
iran_monitor.db, alongside the existing YoY series.

Background:
  May 2026 reviewer asked for the Regional Sectoral Activity charts
  to show level/index (matching Singapore Sectoral IPI's "Index 2025=100"
  format) instead of YoY %. The level data was previously here but was
  swapped to YoY by `migrate_swap_regional_ipi_to_yoy.py` because
  China's level series (CEIC 371937157) went stale in Nov 2022.

  This script re-introduces the level data as a parallel namespace —
  `regional_ipi_level_<iso2>` — leaving the YoY series intact. A
  derived series step (`compute_regional_ipi_index_levels`) then
  rebases each country to a common 2025=100 scale at build time.

  China: the old `371937157` source key has been replaced with
  `TODO_VAI_LEVEL_CN` in series_config.py until a fresh CEIC audit
  identifies the right NBS Value Added of Industry (VAI) LEVEL series.
  The script will skip China gracefully if its source_key is set to
  the TODO sentinel; the rest of the 10 countries will fetch.

Pattern (same as migrate_swap_regional_ipi_to_yoy.py):
  1. Login to CEIC, fetch each level series (skip China if TODO).
  2. Stage scratch DB at /tmp.
  3. DELETE existing regional_ipi_level_* rows.
  4. INSERT freshly fetched rows.
  5. Verify, copy back.

Run from the Iran Monitor root with .env present:
  python3.11 scripts/migrate_fetch_regional_ipi_levels.py

Then rebuild:
  python3.11 scripts/build_iran_monitor.py
"""
from __future__ import annotations

import os
import shutil
import sqlite3
import sys
from pathlib import Path


def _load_env(path: Path) -> None:
    if not path.exists():
        return
    for line in path.read_text().splitlines():
        s = line.strip()
        if not s or s.startswith("#") or "=" not in s:
            continue
        k, _, v = s.partition("=")
        os.environ.setdefault(k.strip(), v.strip().strip("'\""))


ROOT = Path(__file__).resolve().parent.parent
_load_env(ROOT / ".env")
_load_env(Path("/Users/kevinlim/Documents/MAS/Projects/ESD/Middle East Dashboard/.env"))

DB_LIVE     = ROOT / "data" / "iran_monitor.db"
DB_SCRATCH  = Path("/tmp") / "iran_monitor_fetch_regional_ipi_levels.db"
TARGET_PREFIX = "regional_ipi_level_"

sys.path.insert(0, str(ROOT))
from src.series_config import SERIES_REGISTRY  # noqa: E402


def get_targets() -> list[tuple[str, dict]]:
    return [
        (sid, sdef) for sid, sdef in SERIES_REGISTRY.items()
        if sid.startswith(TARGET_PREFIX)
    ]


def fetch_series_from_ceic(source_key: str) -> list[tuple[str, float]]:
    from ceic_api_client.pyceic import Ceic
    result = Ceic.series_data(str(source_key))
    if not hasattr(result, "data") or not result.data:
        return []
    time_points = getattr(result.data[0], "time_points", []) or []
    rows: list[tuple[str, float]] = []
    for tp in time_points:
        try:
            d = str(tp.date)[:10]
            v = float(tp.value)
            rows.append((d, v))
        except (TypeError, ValueError, AttributeError):
            continue
    rows.sort()
    return rows


def main() -> None:
    if not DB_LIVE.exists():
        sys.exit(f"DB not found: {DB_LIVE}")

    targets = get_targets()
    if len(targets) != 10:
        sys.exit(f"Expected 10 regional_ipi_level_* entries in SERIES_REGISTRY; found {len(targets)}.")

    user = os.environ.get("CEIC_USERNAME", "")
    pwd  = os.environ.get("CEIC_PASSWORD", "")
    if not user or not pwd:
        sys.exit("CEIC_USERNAME / CEIC_PASSWORD not set (check Iran Monitor/.env).")

    from ceic_api_client.pyceic import Ceic
    print(f"Logging in as {user}...")
    Ceic.login(user, pwd)
    print("Login OK\n")

    fetched: dict[str, tuple[dict, list[tuple[str, float]]]] = {}
    skipped: list[tuple[str, str]] = []
    for sid, sdef in targets:
        source_key = str(sdef["source_key"])
        label = sdef.get("label", sid)
        if source_key.startswith(("TODO", "SKIP")):
            print(f"  ⚠ SKIP    {sid:<28s} source_key={source_key}")
            skipped.append((sid, source_key))
            continue
        print(f"  Fetching  {sid:<28s} CEIC {source_key} — {label}")
        try:
            rows = fetch_series_from_ceic(source_key)
        except Exception as exc:
            print(f"    FAIL  {exc}")
            rows = []
        if not rows:
            print(f"    EMPTY (skipping)")
            continue
        print(f"    OK    {len(rows)} pts, latest {rows[-1][0]}")
        fetched[sid] = (sdef, rows)

    Ceic.logout()
    print(f"\nFetched {len(fetched)}/{len(targets) - len(skipped)} non-TODO series successfully.")
    if skipped:
        print(f"Skipped {len(skipped)} TODO series: {[s for s,_ in skipped]}")

    if not fetched:
        sys.exit("Nothing fetched. Aborting (would otherwise wipe existing data).")

    print(f"\nStaging DB at {DB_SCRATCH}")
    if DB_SCRATCH.exists():
        DB_SCRATCH.unlink()
    journal = DB_SCRATCH.with_suffix(DB_SCRATCH.suffix + "-journal")
    if journal.exists():
        journal.unlink()
    shutil.copy(DB_LIVE, DB_SCRATCH)

    conn = sqlite3.connect(DB_SCRATCH)
    cur = conn.cursor()

    # Wipe existing rows for these series_ids (clears any stale data)
    n_deleted = 0
    for sid, _ in fetched.items():
        n = cur.execute("DELETE FROM time_series WHERE series_id=?", (sid,)).rowcount
        n_deleted += n
    print(f"\nDeleted {n_deleted} existing rows across {len(fetched)} series_ids.")

    # Insert fresh rows
    out_rows = []
    for sid, (sdef, rows) in fetched.items():
        label = sdef.get("label", sid)
        unit  = sdef.get("unit", "Index")
        freq  = sdef.get("frequency", "Monthly")
        for d, v in rows:
            out_rows.append((d, v, sid, label, "ceic", unit, freq))
    cur.executemany(
        "INSERT INTO time_series "
        "(date, value, series_id, series_name, source, unit, frequency, category) "
        "VALUES (?, ?, ?, ?, ?, ?, ?, NULL)",
        out_rows,
    )
    conn.commit()
    print(f"Inserted {len(out_rows)} new rows.")

    # Verify
    print("\nVerification — rows per series in scratch DB:")
    for sid in fetched:
        n = cur.execute("SELECT COUNT(*) FROM time_series WHERE series_id=?", (sid,)).fetchone()[0]
        latest = cur.execute("SELECT MAX(date) FROM time_series WHERE series_id=?", (sid,)).fetchone()[0]
        print(f"  {sid:<28s} {n:>4d} rows, latest {latest}")

    conn.close()

    print(f"\nCopying scratch DB back to {DB_LIVE}")
    shutil.copy(DB_SCRATCH, DB_LIVE)

    # Refresh the rebased index series so the 2025=100 chart-ready data
    # in `regional_ipi_index_<iso2>` reflects the freshly fetched levels.
    # (Otherwise the chart would still show whatever was last computed,
    # typically the YoY-chain fallback for all 10 countries.)
    print("\nRebasing levels to 2025=100 (regional_ipi_index_<iso2>)...")
    from src.db import get_connection  # noqa: E402
    from src.derived_series import compute_regional_ipi_index_levels  # noqa: E402
    rb_conn = get_connection()
    n_rebased = compute_regional_ipi_index_levels(rb_conn)
    print(f"  -> {n_rebased} rebased index rows")

    print("\n✅ Done.")
    print(f"\nNext: python3 scripts/build_iran_monitor.py")


if __name__ == "__main__":
    main()
