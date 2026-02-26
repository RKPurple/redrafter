import psycopg2
import psycopg2.extras
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uuid
import os
from pydantic import BaseModel
from typing import Literal, Any
from playwright.sync_api import sync_playwright
from fastapi.responses import Response
import httpx
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).parent.parent / ".env")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
DATABASE_URL = os.getenv("DATABASE_URL")

from queries.drafts import get_all_draft_years, get_draft_by_year

app = FastAPI(title="NBA Redraft API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory store: token -> picks data
print_store: dict = {}

def get_db():
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = False
    return conn, conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
class PrintData(BaseModel):
    resolvedPicks: list[Any]
    selectedYear: int
    viewSlots: int | str
    page: int

@app.get("/drafts/{year}")
def draft_by_year(
    year: int,
    draft_filter: Literal["all", "drafted", "undrafted"] | None = None,
):
    conn, cur = get_db()
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
    conn, cur = get_db()
    cur.execute(get_all_draft_years())
    rows = cur.fetchall()
    conn.close()
    
    if not rows:
        raise HTTPException(status_code=404, detail="No Draft Data Available")

    return [
        row["year"] for row in rows
    ]

@app.get("/headshot/{nba_stats_id}")
def headshot(nba_stats_id: int):
    url = f"https://cdn.nba.com/headshots/nba/latest/1040x760/{nba_stats_id}.png"
    with httpx.Client() as client:
        res = client.get(url, follow_redirects=True)
    return Response(content=res.content, media_type="image/png")

@app.post("/print-data")
def store_print_data(data: PrintData):
    token = str(uuid.uuid4())
    print_store[token] = data.model_dump()
    return  { "token": token }

@app.get("/print-data/{token}")
def get_print_data(token: str):
    if token not in print_store:
        raise HTTPException(status_code=404, detail="Token not found")
    return print_store[token]

@app.get("/screenshot/{token}")
def screenshot(token: str):
    if token not in print_store:
        raise HTTPException(status_code=404, detail="Token not found")

    with sync_playwright() as p:
        browser = p.chromium.launch(args=["--disable-web-security"])
        page = browser.new_page(
            viewport={"width": 1440, "height": 900},
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page.goto(f"{FRONTEND_URL}/print?token={token}")
        page.wait_for_selector(".view-content", state="visible")
        page.wait_for_load_state("networkidle")
        element = page.query_selector(".view-content")
        image_bytes = element.screenshot()
        browser.close()

    del print_store[token]
    return Response(content=image_bytes, media_type="image/png")