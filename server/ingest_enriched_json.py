import psycopg2
import psycopg2.extras
import json
from pathlib import Path
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).parent / ".env")
DATABASE_URL = os.getenv("DATABASE_URL")

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

def ingest(file_path: Path):
    with open(file_path, encoding="utf-8") as f:
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
    conn.commit()

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Ingest enriched draft data into the database.")
    parser.add_argument(
        "-y", "--year",
        type=int,
        default=2025,
        help="Draft year to ingest (default: 2025)",
    )
    args = parser.parse_args()

    ingest(Path(f"../scripts/output/draft_{args.year}_enriched.jsonl"))
    print("Ingestion complete :)")