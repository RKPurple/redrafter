import os
import requests
from bs4 import BeautifulSoup
import json
import time
import re

CLUB_OVERWRITES = {
    # "substring to match": "value to return"
    "Loyola (MD)" : "Loyola MD",
    "Ranney School" : "Ranney School",
    "Vanier College" : "Vanier College",
    "Moravian" : "High School",
    "IMG": "IMG Academy",
    "Princeton HS": "High School",
    "G League": "G League",
    "Brewster": "High School",
    "Chalmette HS": "High School",
    "D-League": "G League",
    "Loyola (Illinois)": "Loyola IL",
    "Orangeville Prep": "High School",
    "Guangdong": "China",
    "Australian Institute of Sport": "Australia",
    "Miami (FL)": "Miami",
    "Stoneridge Prep": "High School",
    "Robert Morris": "Robert Morris IL"
}

def fix_club(club: str) -> str:
    for key, value in CLUB_OVERWRITES.items():
        if key in club:
            return value
    if "(" not in club:
        return club
    yrs = ["Fr.", "So.", "Jr.", "Sr."]
    parts = club.split("(", 1)
    parts[1] = parts[1].replace(")", "")
    if (parts[1] in yrs): # College
        college = parts[0].strip()
        college = re.sub(r'(?<=\w\s)\bSt\.\s*$', 'State', college)
        return college
    else: # International
        return parts[1]


def fix_name(name: str) -> str:
    name = name.replace("#", "").replace("~", "").replace("+", "").replace("*", "")
    parts = name.split()
    cleaned_parts = []
    
    for i, part in enumerate(parts):
        # For the last part, keep it as-is if it ends with a period (e.g., "Jr.")
        if i == len(parts) - 1:
            cleaned_parts.append(part)
        else:
            # Remove all punctuation (like periods) from first/middle names
            cleaned_part = re.sub(r'[^\w]', '', part)
            cleaned_parts.append(cleaned_part)
    
    return ' '.join(cleaned_parts)

def final_team(selection: str):
    match = re.search(r'traded to\s+([A-Za-z\s]+?)(?:\s+via|\)|\[|$)', selection)
    if match:
        city = match.group(1).strip()
        return city
    return None

def scrape_draft(year):
    headers = {
        "User-Agent": "Mozilla/5.0 (NBA Redraft Project)"
    }

    positions = ['PG', 'SG', 'SF', 'PF', 'C', 'PG/SG', 'SG/PG', 'PG/SF', 'SF/PG', 'PG/PF', 'PF/PG', 'PG/C', 'C/PG', 'SG/SF', 'SF/SG', 'SG/PF', 'PF/SG', 'SG/C', 'C/SG', 'SF/PF', 'PF/SF', 'SF/C', 'C/SF', 'PF/C', 'C/PF']

    url = f"https://en.wikipedia.org/wiki/{year}_NBA_draft"
    html = requests.get(url, headers=headers, timeout=10)
    html.encoding = "utf-8"
    soup = BeautifulSoup(html.text, "lxml")
    rows = soup.select("table tr")
    
    out_dir = f"../scripts/intermediate/{year}"
    os.makedirs(out_dir, exist_ok=True)
    with open(f"{out_dir}/wiki_{year}.jsonl", "w", encoding="utf-8") as f:
        for row in rows:
            cells = [cell.get_text(strip=True) for cell in row.find_all(["td", "th"])]
            if not cells or (len(cells) <= 1):
                continue
            elif (cells[0] == '1' or cells[0] == '2'):
                club = fix_club(cells[6])
                name = fix_name(cells[2])
                team = final_team(cells[5])
                record = {
                    "wiki_name": name,
                    "position": cells[3],
                    "traded": team,
                    "club": club,
                    "undrafted": False
                }
                f.write(json.dumps(record, ensure_ascii=False) + "\n")
            elif (cells[1] in positions):
                club = fix_club(cells[3])
                name = fix_name(cells[0])
                record = {
                    "wiki_name": cells[0],
                    "position": cells[1],
                    "traded": None,
                    "club": club,
                    "undrafted": True
                }
                f.write(json.dumps(record, ensure_ascii=False) + "\n")

if __name__ == "__main__":
    scrape_draft(2025)