# Query to get a player by their id
def get_player_by_id() -> str:
    return """
    SELECT
        p.id,
        p.canonical_name,
        p.position,
        p.college_or_club,
        p.nba_stats_id,
        p.undrafted
    FROM players p
    WHERE p.id = ?;
    """

# Query to get a players draft history
def get_player_draft_history() -> str:
    return """
    SELECT
        d.year,
        dp.pick_number,
        drafted.abbr AS drafted_by,
        traded.abbr AS traded_to
    FROM draft_picks dp
    JOIN drafts d ON dp.draft_id = d.id
    LEFT JOIN teams drafted ON dp.drafted_by_team_id = drafted.id
    LEFT JOIN teams traded ON dp.traded_to_team_id = traded.id
    WHERE dp.player_id = ?
    ORDER BY d.year;
    """
