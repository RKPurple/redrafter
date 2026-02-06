import "./DraftPickCard.css";


type DraftPickCardProps = {
    pickNumber: number | null;
    playerName: string | null;
    playerPosition: string | null;
    playerCollegeOrClub: string | null;
    draftedBy: string | null;
    tradedTo: string | null;
    playerNbaStatsId: number | null;
}

function DraftPickCard({
    pickNumber,
    playerName,
    playerPosition,
    playerCollegeOrClub,
    draftedBy,
    tradedTo,
    playerNbaStatsId,
}: DraftPickCardProps) {
    const displayTeam = tradedTo ?? draftedBy ?? "NBA";
    const abbr = displayTeam.toLowerCase();
    const headshotSrc = `https://cdn.nba.com/headshots/nba/latest/1040x760/${playerNbaStatsId ?? 0}.png`;
    const style: React.CSSProperties = {
        background: `linear-gradient(
            90deg,
            var(--${abbr}-grad-start),
            var(--${abbr}-grad-end)
        )`,
    }
    const pickLabel = pickNumber === null ? "UDFA" : `#${pickNumber}`;
    return (
        <div className="draft-card" style={style}>
            {/* Header Text */}
            <div className="draft-card-header">
                <div className="selection-number">
                    {pickLabel}
                </div>
                <div className="player-meta">
                    <span className="player-name">
                        {playerName ?? "Unknown"}
                    </span>
                    {playerPosition && (
                        <span className="player-position">
                            {playerPosition}
                        </span>
                    )}
                </div>
            </div>
            {/* Team Logos Container */}
            <div className="team-logos">
                {/* Always Shown */}
                <img
                    className="primary-logo"
                    src={`/src/assets/teams/${abbr}.svg`}
                    alt={abbr}
                />
                {/* Shown only for traded players */}
                {tradedTo && draftedBy && (
                    <img
                        className="secondary-logo"
                        src={`/src/assets/teams/${draftedBy}.svg`}
                        alt={draftedBy}
                    />
                )}
            </div>
            {/* Player Headshot */}
            <img
                className="player-headshot"
                src={headshotSrc}
                alt={'https://cdn.nba.com/headshots/nba/latest/1040x760/0.png'}
            />
        </div>
    )
};

export default DraftPickCard;