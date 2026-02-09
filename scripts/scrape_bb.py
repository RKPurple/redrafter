import os
import requests
from bs4 import BeautifulSoup
import json
import time
from nba_api.stats.static import players

def get_player_id(player: str):
    player_obj = players.find_players_by_full_name(player)
    if (not player_obj):
        return None
    else:
        return player_obj[0]['id']

def scrape_draft(year):
    headers = {
        "User-Agent": "Mozilla/5.0 (NBA Redraft Project)"
    }

    url = f"https://www.basketball-reference.com/draft/NBA_{year}.html"
    html = requests.get(url, headers=headers, timeout=10)
    html.encoding = "utf-8"

    soup = BeautifulSoup(html.text, "lxml")
    rows = soup.select("table tr")

    out_dir = f"../scripts/intermediate/{year}"
    os.makedirs(out_dir, exist_ok=True)
    with open(f"{out_dir}/bb_{year}.jsonl", "w", encoding="utf-8") as f:
        for row in rows:
            cells = [cell.get_text(strip=True) for cell in row.find_all("td")]
            if not cells or (len(cells) < 4 or cells[2] == ""):
                continue
            player_id = get_player_id(cells[2])
            record = {
                "year": year,
                "pick": cells[0],
                "team": cells[1],
                "bb_name": cells[2],
            }
            f.write(json.dumps(record, ensure_ascii=False) + "\n")

if __name__ == "__main__":
    scrape_draft(2025)