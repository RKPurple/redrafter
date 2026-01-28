def get_draft_by_year() -> str:
    return """
    SELECT
        d.year,
        dp.pick_number,
        drafted.abbr AS drafted_by,
        traded.abbr AS traded_to,
        p.canonical_name,
        p.position,
        p.college_or_club,
        p.undrafted
    
    FROM draft_picks dp
    JOIN drafts d ON dp.draft_id = d.id
    JOIN players p ON dp.player_id = p.id

    LEFT JOIN teams drafted ON dp.drafted_by_team_id = drafted.id
    LEFT JOIN teams traded ON dp.traded_to_team_id = traded.id

    WHERE d.year = ?
    ORDER BY
        CASE WHEN dp.pick_number IS NULL THEN 1 ELSE 0 END,
        dp.pick_number;
    """