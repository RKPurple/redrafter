# Query to get all the teams in the db
def get_all_teams() -> str:
    return """
    SELECT
        id,
        abbr,
        city,
        name
    FROM teams
    ORDER BY abbr;
    """

# Query a specific teams draft picks 
def get_team_draft_picks() -> str:
    return """
    SELECT
        d.year,
        dp.pick_number,
        p.canonical_name,
        p.position,
        p.college_or_club,
        drafted.abbr AS drafted_by,
        traded.abbr AS traded_to
    FROM draft_picks dp
    JOIN drafts d ON dp.draft_id = d.id
    JOIN players p ON dp.player_id = p.id
    JOIN teams drafted ON dp.drafted_by_team_id = drafted.id
    LEFT JOIN teams traded ON dp.traded_to_team_id = traded.id
    WHERE drafted.abbr = ?
    ORDER BY d.year DESC, dp.pick_number;
    """