from codecs import lookup
import argparse
import unicodedata
import re
import json
from nba_api.stats.static import players

def normalize_name(name: str) -> str:
    name = name.replace("#", "").replace("~", "").replace("+", "").replace("*", "").replace(" Jr.", "")
    name = unicodedata.normalize("NFKD", name)
    name = name.encode("ascii", "ignore").decode("ascii")
    name = name.lower()
    name = re.sub(r'\s+(?:i{1,3}|iv|v|vi{0,3}|ix|x|xi{0,3}|xii|xiii)\s*$', '', name)
    name = re.sub(r"\b([a-z])\s+([a-z])\b", r"\1\2", name)
    name = re.sub(r"[^\w\s]", "", name)
    name = re.sub(r"\s+", " ", name)
    name = re.sub(r"\bdj", "d", name)
    return name.strip()

def normalize_team(city: str) -> str:
    nba_teams = {
        "atlanta": "ATL",
        "boston": "BOS",
        "brooklyn": "BRK",
        "charlotte": "CHO",
        "chicago": "CHI",
        "cleveland": "CLE",
        "dallas": "DAL",
        "denver": "DEN",
        "detroit": "DET",
        "golden state": "GSW",
        "houston": "HOU",
        "indiana": "IND",
        "la clippers": "LAC",
        "la lakers": "LAL",
        "memphis": "MEM",
        "miami": "MIA",
        "milwaukee": "MIL",
        "minnesota": "MIN",
        "new orleans": "NOP",
        "new york": "NYK",
        "oklahoma city": "OKC",
        "orlando": "ORL",
        "philadelphia": "PHI",
        "phoenix": "PHO",
        "portland": "POR",
        "sacramento": "SAC",
        "san antonio": "SAS",
        "toronto": "TOR",
        "utah": "UTA",
        "washington": "WAS"
    }
    city = city.lower()
    return nba_teams[city]

def get_player_id(bb_name: str, wiki_name: str):
    names_to_try = []

    if bb_name:
        names_to_try.append(bb_name)
    if wiki_name:
        names_to_try.append(wiki_name)

    for name in names_to_try:
        player_obj = players.find_players_by_full_name(name)
        if player_obj:
            return player_obj[0]["id"]

    return None

def merge(year):
    wiki_map = {}

    with open(f"../scripts/overrides/name_overrides.json", encoding="utf-8") as f:
        NAME_OVERRIDES = json.load(f)

    with open(f"../scripts/intermediate/{year}/wiki_{year}.jsonl", encoding="utf-8") as f:
        for line in f:
            record = json.loads(line)
            key = normalize_name(record["wiki_name"])
            wiki_map[key] = record
    bb_keys = set()

    with open(f"../scripts/output/draft_{year}_enriched.jsonl", "w", encoding="utf-8") as out:
        with open(f"../scripts/intermediate/{year}/bb_{year}.jsonl", encoding="utf-8") as bb:
            for line in bb:
                bb_rec = json.loads(line)
                key = normalize_name(bb_rec["bb_name"])
                override = NAME_OVERRIDES.get(key)
                lookup_key = normalize_name(override) if override else key
                bb_keys.add(lookup_key)
                wiki_rec = wiki_map.get(lookup_key)
                match_status = "matched"
                
                if not wiki_rec:
                    match_status = "bb_only"
                    print(f"NO MATCH: {bb_rec['bb_name']}, Normalized BB_Name: {normalize_name(bb_rec['bb_name'])}")
                    f'''
                        Print the names of wiki rec and bb_name normalization
                        Keys in name_overrides.json = normalized basketball-reference names.
                        Values = strings whose normalized form is the key used to look up in wiki_map (i.e. the wiki-side normalized name you want to match).
                        So name_overrides = “when BB normalizes to X, look up wiki under the normalized form of Y instead of X.”
                    '''
                
                traded = None
                if wiki_rec and wiki_rec["traded"]:
                    traded = normalize_team(wiki_rec["traded"])

                nba_stats_id = get_player_id(bb_rec["bb_name"], wiki_rec["wiki_name"] if wiki_rec else None)
                merged = {
                    "year": bb_rec["year"],
                    "draft": {
                        "pick_number": bb_rec["pick"],
                        "drafted_by": bb_rec["team"],
                        "traded_to": traded
                    },
                    "player": {
                        "nba_stats_id": nba_stats_id,
                        "bb_name": bb_rec["bb_name"],
                        "wiki_name": wiki_rec["wiki_name"] if wiki_rec else None,
                        "canonical_name": bb_rec["bb_name"],
                        "position": wiki_rec["position"] if wiki_rec else None,
                        "college_or_club": wiki_rec["club"] if wiki_rec else None,
                        "undrafted": False
                    },
                    "match_status": match_status
                }
                out.write(json.dumps(merged, ensure_ascii=False) + "\n")

    with open(f"../scripts/output/draft_{year}_enriched.jsonl", "a", encoding="utf-8") as out:
        for key, wiki_rec in wiki_map.items():
            if key not in bb_keys and wiki_rec["undrafted"]:
                nba_stats_id = get_player_id("", wiki_rec["wiki_name"])
                merged = {
                    "year": year,
                    "draft": {
                        "pick_number": None,
                        "drafted_by": None,
                        "traded_to": None
                    },
                    "player": {
                        "nba_stats_id": nba_stats_id,
                        "bb_name": None,
                        "wiki_name": wiki_rec["wiki_name"],
                        "canonical_name": wiki_rec["wiki_name"],
                        "position": wiki_rec["position"],
                        "college_or_club": wiki_rec["club"],
                        "undrafted": True
                    },
                    "match_status": "wiki_only"
                }
                out.write(json.dumps(merged, ensure_ascii=False) + "\n")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Merge basketball-reference and Wikipedia draft data for a given year.")
    parser.add_argument(
        "-y", "--year",
        type=int,
        default=2025,
        help="Draft year to merge (default: 2025)",
    )
    args = parser.parse_args()
    merge(args.year)