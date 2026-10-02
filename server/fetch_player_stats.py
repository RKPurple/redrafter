import psycopg2
import psycopg2.extras
import time
from pathlib import Path
import os
from dotenv import load_dotenv
from nba_api.stats.endpoints import playercareerstats

load_dotenv(dotenv_path=Path(__file__).parent / ".env")
DATABASE_URL = os.getenv("DATABASE_URL")

REQUEST_DELAY = 0.8
MAX_RETRIES = 3

# API column -> DB column, shared by season and career rows
STAT_COLUMNS = [
    "GP", "GS", "MIN",
    "FGM", "FGA", "FG_PCT",
    "FG3M", "FG3A", "FG3_PCT",
    "FTM", "FTA", "FT_PCT",
    "OREB", "DREB", "REB",
    "AST", "STL", "BLK", "TOV", "PF", "PTS",
]
DB_STAT_COLUMNS = [c.lower() for c in STAT_COLUMNS]

SEASON_DATASETS = {
    "regular": "SeasonTotalsRegularSeason",
    "playoffs": "SeasonTotalsPostSeason",
}
CAREER_DATASETS = {
    "regular": "CareerTotalsRegularSeason",
    "playoffs": "CareerTotalsPostSeason",
}

conn = psycopg2.connect(DATABASE_URL)
conn.autocommit = False
cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

def get_target_players(years: list[int] | None, missing_only: bool) -> list[dict]:
    conditions = ["p.nba_stats_id IS NOT NULL"]
    params: list = []
    if years is not None:
        conditions.append("d.year = ANY(%s)")
        params.append(years)
    if missing_only:
        conditions.append(
            "NOT EXISTS (SELECT 1 FROM player_career_stats pcs WHERE pcs.player_id = p.id)"
        )

    cur.execute(
        f"""
        SELECT DISTINCT p.id, p.nba_stats_id, p.canonical_name
        FROM players p
        JOIN draft_picks dp ON dp.player_id = p.id
        JOIN drafts d ON dp.draft_id = d.id
        WHERE {" AND ".join(conditions)}
        ORDER BY p.id
        """,
        params,
    )
    return cur.fetchall()

def fetch_career_stats(nba_stats_id: int) -> dict:
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            return playercareerstats.PlayerCareerStats(
                player_id=nba_stats_id,
                per_mode36="Totals",
                timeout=30,
            ).get_normalized_dict()
        except KeyError:
            # stats.nba.com returns an empty body for some players; retrying doesn't help
            return {}
        except Exception:
            if attempt == MAX_RETRIES:
                raise
            time.sleep(REQUEST_DELAY * 5 * attempt)

def stat_values(row: dict) -> list:
    return [row.get(c) for c in STAT_COLUMNS]

def save_player_stats(player_id: int, data: dict) -> int:
    cur.execute(
        "DELETE FROM player_season_stats WHERE player_id = %s",
        (player_id,)
    )

    season_rows = 0
    for season_type, dataset in SEASON_DATASETS.items():
        for row in data.get(dataset, []):
            cur.execute(
                f"""
                INSERT INTO player_season_stats (
                    player_id, season_type, season_id, team_id, team_abbr, player_age,
                    {", ".join(DB_STAT_COLUMNS)}
                )
                VALUES (%s, %s, %s, %s, %s, %s, {", ".join(["%s"] * len(DB_STAT_COLUMNS))})
                """,
                (
                    player_id,
                    season_type,
                    row["SEASON_ID"],
                    row["TEAM_ID"],
                    row["TEAM_ABBREVIATION"],
                    row["PLAYER_AGE"],
                    *stat_values(row),
                )
            )
            season_rows += 1

    for season_type, dataset in CAREER_DATASETS.items():
        rows = data.get(dataset, [])
        if not rows:
            cur.execute(
                "DELETE FROM player_career_stats WHERE player_id = %s AND season_type = %s",
                (player_id, season_type)
            )
            continue
        cur.execute(
            f"""
            INSERT INTO player_career_stats (
                player_id, season_type, {", ".join(DB_STAT_COLUMNS)}
            )
            VALUES (%s, %s, {", ".join(["%s"] * len(DB_STAT_COLUMNS))})
            ON CONFLICT (player_id, season_type) DO UPDATE SET
                {", ".join(f"{c} = EXCLUDED.{c}" for c in DB_STAT_COLUMNS)},
                updated_at = NOW()
            """,
            (player_id, season_type, *stat_values(rows[0]))
        )

    return season_rows

def fetch_players(players: list[dict]) -> int:
    succeeded = 0
    no_data = []
    for i, player in enumerate(players, start=1):
        label = f"[{i}/{len(players)}] {player['canonical_name']} ({player['nba_stats_id']})"
        try:
            data = fetch_career_stats(player["nba_stats_id"])
            season_rows = save_player_stats(player["id"], data)
            conn.commit()
            succeeded += 1
            if data.get(CAREER_DATASETS["regular"]):
                print(f"{label} saved {season_rows} season rows")
            else:
                no_data.append(player["canonical_name"])
                print(f"{label} no data from stats.nba.com")
        except Exception as e:
            conn.rollback()
            print(f"{label} FAILED: {e}")
        time.sleep(REQUEST_DELAY)
    if no_data:
        print(f"No stats available for {len(no_data)} players: {', '.join(no_data)}")
    return succeeded

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Fetch nba_api career stats for drafted players into the database.")
    group = parser.add_mutually_exclusive_group()
    group.add_argument(
        "-y", "--year",
        type=int, nargs="+",
        help="One or more draft years (e.g. -y 2024 2025).",
    )
    group.add_argument(
        "--range",
        type=int, nargs=2, metavar=("START", "END"),
        help="Inclusive draft year range, e.g. --range 2000 2025.",
    )
    group.add_argument(
        "--all",
        action="store_true",
        help="Fetch stats for players in every draft in the database.",
    )
    parser.add_argument(
        "--missing-only",
        action="store_true",
        help="Skip players that already have career stats saved.",
    )
    args = parser.parse_args()

    if args.all:
        years = None
    elif args.range:
        start, end = sorted(args.range)
        years = list(range(start, end + 1))
    elif args.year:
        years = sorted(set(args.year))
    else:
        years = [2025]

    players = get_target_players(years, args.missing_only)
    if not players:
        print("No players to fetch.")
        raise SystemExit(0)

    succeeded = fetch_players(players)
    print(f"Done. {succeeded}/{len(players)} players fetched.")
