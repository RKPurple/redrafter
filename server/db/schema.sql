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

/* Teams */
CREATE TABLE teams (
    id SERIAL PRIMARY KEY,

    abbr TEXT UNIQUE NOT NULL,
    city TEXT NOT NULL,
    name TEXT NOT NULL
);

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