import psycopg2
import psycopg2.extras
import json
import re
from pathlib import Path
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).parent / ".env")
DATABASE_URL = os.getenv("DATABASE_URL")

SCRIPT_DIR = Path(__file__).parent
OUTPUT_DIR = (SCRIPT_DIR / "../scripts/output").resolve()

conn = psycopg2.connect(DATABASE_URL)
conn.autocommit = False
cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

def get_or_create_draft(year: int) -> int:
    cur.execute(
        "INSERT INTO drafts (year) VALUES (%s) ON CONFLICT DO NOTHING",
        (year,)
    )
    cur.execute(
        "SELECT id FROM drafts WHERE year = %s",
        (year,)
    )
    return cur.fetchone()["id"]

def get_or_create_player(player: dict) -> int:
    cur.execute(
        """
        INSERT INTO players (
            canonical_name,
            bb_name,
            wiki_name,
            nba_stats_id,
            position,
            college_or_club,
            undrafted
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT DO NOTHING
        """,
        (
            player["canonical_name"],
            player["bb_name"],
            player["wiki_name"],
            player["nba_stats_id"],
            player["position"],
            player["college_or_club"],
            player["undrafted"],
        )
    )

    if player["nba_stats_id"] is not None:
        cur.execute(
            "SELECT id FROM players WHERE nba_stats_id = %s",
            (player["nba_stats_id"],)
        )
    else:
        cur.execute(
            "SELECT id FROM players WHERE canonical_name = %s",
            (player["canonical_name"],)
        )
    return cur.fetchone()["id"]

def get_team_id(abbr: str | None) -> int | None:
    if abbr is None:
        return None
    
    cur.execute(
        "SELECT id FROM teams WHERE abbr = %s",
        (abbr,)
    )
    row = cur.fetchone()
    return row["id"] if row else None

def insert_draft_pick(
    draft_id: int,
    player_id: int,
    draft: dict,
    match_status: str
):
    cur.execute(
        """
        INSERT INTO draft_picks (
            draft_id,
            player_id,
            pick_number,
            drafted_by_team_id,
            traded_to_team_id,
            match_status
        )
        VALUES (%s, %s, %s, %s, %s, %s)    
        ON CONFLICT DO NOTHING
        """,
        (
            draft_id,
            player_id,
            draft["pick_number"],
            get_team_id(draft["drafted_by"]),
            get_team_id(draft["traded_to"]),
            match_status
        )
    )

def enriched_path(year: int) -> Path:
    return OUTPUT_DIR / f"draft_{year}_enriched.jsonl"

def discover_all_years() -> list[int]:
    years = []
    for p in OUTPUT_DIR.glob("draft_*_enriched.jsonl"):
        m = re.match(r"draft_(\d{4})_enriched\.jsonl$", p.name)
        if m:
            years.append(int(m.group(1)))
    return sorted(years)

def ingest_year(year: int) -> bool:
    path = enriched_path(year)
    if not path.exists():
        print(f"[{year}] skipped — file not found: {path}")
        return False
    try:
        with open(path, encoding="utf-8") as f:
            count = 0
            for line in f:
                record = json.loads(line)

                draft_id = get_or_create_draft(record["year"])
                player_id = get_or_create_player(record["player"])

                insert_draft_pick(
                    draft_id=draft_id,
                    player_id=player_id,
                    draft=record["draft"],
                    match_status=record["match_status"],
                )
                count += 1
        conn.commit()
        print(f"[{year}] ingested {count} picks")
        return True
    except Exception as e:
        conn.rollback()
        print(f"[{year}] FAILED: {e}")
        return False

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Ingest enriched draft data into the database.")
    group = parser.add_mutually_exclusive_group()
    group.add_argument(
        "-y", "--year",
        type=int, nargs="+",
        help="One or more draft years (e.g. -y 2024 2025).",
    )
    group.add_argument(
        "--range",
        type=int, nargs=2, metavar=("START", "END"),
        help="Inclusive year range, e.g. --range 2000 2025.",
    )
    group.add_argument(
        "--all",
        action="store_true",
        help="Ingest every draft_*_enriched.jsonl found in scripts/output/.",
    )
    args = parser.parse_args()

    if args.all:
        years = discover_all_years()
    elif args.range:
        start, end = sorted(args.range)
        years = list(range(start, end + 1))
    elif args.year:
        years = sorted(set(args.year))
    else:
        years = [2025]

    if not years:
        print("No years to ingest.")
        raise SystemExit(1)

    succeeded = 0
    for y in years:
        if ingest_year(y):
            succeeded += 1
    print(f"Done. {succeeded}/{len(years)} years ingested.")