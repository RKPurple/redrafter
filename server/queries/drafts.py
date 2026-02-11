# Return the draft info for a specific year
# draft_filter: None/"all" = all picks, "drafted" = drafted only, "undrafted" = undrafted only
def get_draft_by_year(draft_filter: str | None = None) -> str:
    undrafted_condition = ""
    if draft_filter == "drafted":
        undrafted_condition = " AND p.undrafted = 0"
    elif draft_filter == "undrafted":
        undrafted_condition = " AND p.undrafted = 1"
    
    return f"""
    SELECT
        d.year,
        dp.pick_number,
        drafted.abbr AS drafted_by,
        traded.abbr AS traded_to,
        p.canonical_name,
        p.position,
        p.college_or_club,
        p.nba_stats_id,
        p.undrafted
    
    FROM draft_picks dp
    JOIN drafts d ON dp.draft_id = d.id
    JOIN players p ON dp.player_id = p.id

    LEFT JOIN teams drafted ON dp.drafted_by_team_id = drafted.id
    LEFT JOIN teams traded ON dp.traded_to_team_id = traded.id

    WHERE d.year = ?{undrafted_condition}
    ORDER BY
        CASE WHEN dp.pick_number IS NULL THEN 1 ELSE 0 END,
        dp.pick_number;
    """

# Query all the available draft years in the db
def get_all_draft_years() -> str:
    return """
    SELECT year
    FROM drafts
    ORDER BY year DESC;
    """