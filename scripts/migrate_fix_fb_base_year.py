#!/usr/bin/env python3
"""
One-off fix: F&B Services Index base year is 2025=100, not 2017=100.

Background:
  Empirical check on data/iran_monitor.db confirmed every fb_* series has an
  exact 2025 annual average of 100.0 (and all over the place at 2017). The
  CEIC ingestor was originally configured with the wrong base-year string in
  the unit field, which the renderer then surfaces as the chart y-axis label.

  This script updates time_series.unit for the six fb_* series so the next
  rebuild emits the correct y-axis label without re-ingesting from CEIC.
  series_config.py has also been corrected, so future ingestions will use
  'Index (2025=100)' for new rows too.

Run from Iran Monitor root:
  python3 scripts/migrate_fix_fb_base_year.py

Idempotent — re-running on a clean DB is a no-op.
"""
from __future__ import annotations

import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DB_LIVE = ROOT / "data" / "iran_monitor.db"


def main() -> None:
    if not DB_LIVE.exists():
        raise SystemExit(f"DB not found: {DB_LIVE}")

    con = sqlite3.connect(DB_LIVE)
    cur = con.cursor()

    before = cur.execute(
        "SELECT COUNT(*) FROM time_series "
        "WHERE series_id LIKE 'fb_%' AND unit = 'Index (2017=100)'"
    ).fetchone()[0]

    if before == 0:
        print("No fb_* rows with stale unit — already migrated.")
        return

    cur.execute(
        "UPDATE time_series SET unit = 'Index (2025=100)' "
        "WHERE series_id LIKE 'fb_%' AND unit = 'Index (2017=100)'"
    )
    con.commit()

    print(f"Updated {before} fb_* rows: 'Index (2017=100)' → 'Index (2025=100)'")
    print("Verification:")
    for sid, unit in cur.execute(
        "SELECT series_id, unit FROM time_series "
        "WHERE series_id LIKE 'fb_%' GROUP BY series_id, unit ORDER BY series_id"
    ):
        print(f"  {sid:<20s}  {unit}")


if __name__ == "__main__":
    main()
