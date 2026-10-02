/* Players */
CREATE TABLE players (
    id SERIAL PRIMARY KEY,

    canonical_name TEXT NOT NULL UNIQUE,
    bb_name TEXT,
    wiki_name TEXT,
    nba_stats_id INTEGER UNIQUE,
    position TEXT,
    college_or_club TEXT,
    undrafted BOOLEAN NOT NULL DEFAULT false
);

/* Franchises */
CREATE TABLE franchises (
    id SERIAL PRIMARY KEY,
    display_name TEXT NOT NULL UNIQUE
);

/* Teams */
CREATE TABLE teams (
    id SERIAL PRIMARY KEY,

    abbr TEXT UNIQUE NOT NULL,
    city TEXT NOT NULL,
    name TEXT NOT NULL,
    franchise_id INTEGER NOT NULL,

    FOREIGN KEY (franchise_id)
        REFERENCES franchises(id)
);

CREATE INDEX idx_teams_franchise_id ON teams(franchise_id);

/* Drafts */
CREATE TABLE drafts (
    id SERIAL PRIMARY KEY,

    year INTEGER UNIQUE NOT NULL
);

/* Draft Picks */
CREATE TABLE draft_picks (
    id SERIAL PRIMARY KEY,

    draft_id INTEGER NOT NULL,
    player_id INTEGER NOT NULL,
    pick_number INTEGER,
    drafted_by_team_id INTEGER,
    traded_to_team_id INTEGER,
    match_status TEXT NOT NULL,

    UNIQUE (draft_id, player_id),

    FOREIGN KEY (draft_id)
        REFERENCES drafts(id)
        ON DELETE CASCADE,

    FOREIGN KEY (player_id)
        REFERENCES players(id)
        ON DELETE CASCADE,

    FOREIGN KEY (drafted_by_team_id)
        REFERENCES teams(id),
    
    FOREIGN KEY (traded_to_team_id)
        REFERENCES teams(id)
);

/* Indexes (Performance) */
CREATE INDEX idx_players_canonical_name
    On players(canonical_name);

CREATE INDEX idx_draft_picks_draft_id
    ON draft_picks(draft_id);

CREATE INDEX idx_draft_picks_player_id
    ON draft_picks(player_id);

/* Player Season Stats (one row per season per team; team_id 0 = TOT row for traded seasons) */
CREATE TABLE IF NOT EXISTS player_season_stats (
    id SERIAL PRIMARY KEY,

    player_id INTEGER NOT NULL,
    season_type TEXT NOT NULL CHECK (season_type IN ('regular', 'playoffs')),
    season_id TEXT NOT NULL,
    team_id INTEGER NOT NULL,
    team_abbr TEXT,
    player_age NUMERIC(4,1),

    gp INTEGER, gs INTEGER, min NUMERIC(8,1),
    fgm INTEGER, fga INTEGER, fg_pct NUMERIC(5,3),
    fg3m INTEGER, fg3a INTEGER, fg3_pct NUMERIC(5,3),
    ftm INTEGER, fta INTEGER, ft_pct NUMERIC(5,3),
    oreb INTEGER, dreb INTEGER, reb INTEGER,
    ast INTEGER, stl INTEGER, blk INTEGER, tov INTEGER, pf INTEGER, pts INTEGER,

    UNIQUE (player_id, season_type, season_id, team_id),

    FOREIGN KEY (player_id)
        REFERENCES players(id)
        ON DELETE CASCADE
);

/* Player Career Stats (career totals per season type) */
CREATE TABLE IF NOT EXISTS player_career_stats (
    player_id INTEGER NOT NULL,
    season_type TEXT NOT NULL CHECK (season_type IN ('regular', 'playoffs')),

    gp INTEGER, gs INTEGER, min NUMERIC(8,1),
    fgm INTEGER, fga INTEGER, fg_pct NUMERIC(5,3),
    fg3m INTEGER, fg3a INTEGER, fg3_pct NUMERIC(5,3),
    ftm INTEGER, fta INTEGER, ft_pct NUMERIC(5,3),
    oreb INTEGER, dreb INTEGER, reb INTEGER,
    ast INTEGER, stl INTEGER, blk INTEGER, tov INTEGER, pf INTEGER, pts INTEGER,

    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    PRIMARY KEY (player_id, season_type),

    FOREIGN KEY (player_id)
        REFERENCES players(id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_player_season_stats_player_id
    ON player_season_stats(player_id);
