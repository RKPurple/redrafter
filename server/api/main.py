from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import sqlite3
from pathlib import Path
from typing import Literal

from queries.drafts import get_all_draft_years, get_draft_by_year

DB_PATH = Path("db/nba.db")
app = FastAPI(title="NBA Redraft API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

@app.get("/drafts/{year}")
def draft_by_year(
    year: int,
    draft_filter: Literal["all", "drafted", "undrafted"] | None = None,
):
    conn = get_db()
    cur = conn.cursor()
    draft_filter = draft_filter if draft_filter else "all"

    cur.execute(get_draft_by_year(draft_filter), (year,))
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
                "nba_stats_id": row["nba_stats_id"],
                "undrafted": bool(row["undrafted"]),
            },
        }
        for row in rows
    ]

@app.get("/draft-years")
def draft_years():
    conn = get_db()
    cur=conn.cursor()
    cur.execute(get_all_draft_years())
    rows = cur.fetchall()
    conn.close()
    
    if not rows:
        raise HTTPException(status_code=404, detail="No Draft Data Available")

    return [
        row["year"] for row in rows
    ]
