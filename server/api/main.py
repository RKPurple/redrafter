from fastapi import FastAPI, HTTPException
import sqlite3
from pathlib import Path

from queries.drafts import get_draft_by_year

DB_PATH = Path("db/nba.db")
app = FastAPI(title="NBA Redraft API")

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

@app.get("/drafts/{year}")
def draft_by_year(year: int):
    conn = get_db()
    cur = conn.cursor()

    cur.execute(get_draft_by_year(), (year,))
    rows = cur.fetchall()
    conn.close()

    if not rows:
        raise HTTPException(status_code=404, detail="Draft Year not found")

    return [
        {
            "year": row["year"],
            "pick_number": row["pick_number"],
            "drafted_by": row["drafted_by"],
            "traded_to": row["traded_to"],
            "player": {
                "name": row["canonical_name"],
                "position": row["position"],
                "college_or_club": row["college_or_club"],
                "undrafted": bool(row["undrafted"]),
            },
        }
        for row in rows
    ]