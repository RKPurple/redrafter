import sqlite3
import json
from pathlib import Path

DB_PATH = Path("db/nba.db")

conn = sqlite3.connect(DB_PATH)
conn.row_factory = sqlite3.Row
cur = conn.cursor()

def get_or_create_draft(year: int) -> int:
    cur.execute(
        "INSERT OR IGNORE INTO drafts (year) VALUES (?)",
        (year,)
    )
    cur.execute(
        "SELECT id FROM drafts WHERE year = ?",
        (year,)
    )
    return cur.fetchone()["id"]

def get_or_create_player(player: dict) -> int:
    cur.execute(
        """
        INSERT OR IGNORE INTO players (
            canonical_name,
            bb_name,
            wiki_name,
            nba_stats_id,
            position,
            college_or_club,
            undrafted
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
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
            "SELECT id FROM players WHERE nba_stats_id = ?",
            (player["nba_stats_id"],)
        )
    else:
        cur.execute(
            "SELECT id FROM players WHERE canonical_name = ?",
            (player["canonical_name"],)
        )
    return cur.fetchone()["id"]

def get_team_id(abbr: str | None) -> int | None:
    if abbr is None:
        return None
    
    cur.execute(
        "SELECT id FROM teams WHERE abbr = ?",
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
        INSERT OR IGNORE INTO draft_picks (
            draft_id,
            player_id,
            pick_number,
            drafted_by_team_id,
            traded_to_team_id,
            match_status
        )
        VALUES (?, ?, ?, ?, ?, ?)    
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
    ingest(Path("../scripts/output/draft_2025_enriched.jsonl"))
    print("Ingestion complete :)")