import "./RedraftedPickCard.css";
import React from "react";


type RedraftedPickCardProps = {
    redraftedPickNumber: number;
    originalPickNumber: number | null;
    playerName: string | null;
    playerPosition: string | null;
    playerCollegeOrClub: string | null;
    reDraftedBy: string | null;
    draftedBy: string | null;
    playerNbaStatsId: number | null;
    onClick: () => void;
    onUnassign: () => void;
    readOnly?: boolean;
    isSelected?: boolean;
    overlayType?: "replace" | "swap";
}

function RedraftedPickCard({
    redraftedPickNumber,
    originalPickNumber,
    playerName,
    playerPosition,
    playerCollegeOrClub,
    reDraftedBy,
    playerNbaStatsId,
    onClick,
    onUnassign,
    readOnly = false,
    isSelected = false,
    overlayType,
}: RedraftedPickCardProps) {
    const preDraftImageError = false;
    const redraftedAbbr = reDraftedBy?.toLowerCase() ?? "nba";
    const headshotSrc = `https://cdn.nba.com/headshots/nba/latest/1040x760/${playerNbaStatsId ?? 0}.png`;
    const playerPreDraft = playerCollegeOrClub?.toLowerCase().replace(/\s+/g, '').replace(/['.]/g, '')

    const style: React.CSSProperties = {
        background: `linear-gradient(
            90deg,
            var(--${redraftedAbbr}-grad-start),
            var(--${redraftedAbbr}-grad-end)
        )`,
        ...(readOnly && { cursor: 'default' }),
    }
    const badgeStyle: React.CSSProperties = {
        '--ring-color': `var(--${redraftedAbbr}-grad-end)`,
    } as React.CSSProperties;

    const trendColor = 
        originalPickNumber === null ? "var(--redraft-riser)" :
        originalPickNumber < redraftedPickNumber ? "var(--redraft-faller)" :
        originalPickNumber > redraftedPickNumber ? "var(--redraft-riser)" :
        "var(--redraft-unchanged)";

    const trendSymbol =
        originalPickNumber === null ? "▲" :
        originalPickNumber > redraftedPickNumber ? "▲" :
        originalPickNumber < redraftedPickNumber ? "▼" :
        "=";

    const trendSize = 
        originalPickNumber === null ? "NR" :
        originalPickNumber > redraftedPickNumber ? redraftedPickNumber - originalPickNumber :
        originalPickNumber < redraftedPickNumber ? originalPickNumber - redraftedPickNumber :
        0;
        
    const glowStyle: React.CSSProperties = {
        '--glow-color': trendColor,
    } as React.CSSProperties;

    return (
        <div className={`redrafted-card${isSelected ? " selected" : ""}`} style={{ ...style, ...glowStyle }} onClick={!readOnly ? onClick : undefined}>
            {overlayType && (
                <div className={`card-overlay ${overlayType}`}>
                    {overlayType === "swap" ? "⇄ SWAP" : "↺ REPLACE"}
                </div>
            )}
            <div className="redrafted-card-content">
                <div className="selection-number" style={badgeStyle}>
                    #{redraftedPickNumber}
                </div>
                <div className="trend-indicator" style={{ color: trendColor}}>
                    {trendSymbol}
                    {trendSize !== 0 && (
                        typeof trendSize === "number" ? Math.abs(trendSize) : trendSize
                    )}
                </div>
                <div className="logos-container">
                    {/* Drafting Team Logo*/}
                    <img
                        className="drafting-team-logo"
                        src={`/teams/${redraftedAbbr}.svg`}
                        alt={redraftedAbbr}
                    />
                </div>
                {/* Player Info */}
                <div className="player-info">
                    <span className="player-name">
                        {playerName ?? "Unknown"}
                    </span>
                    <div className="player-secondary-info">
                        <span className="player-position">
                            {playerPosition ?? "Unknown"}
                        </span>
                        {playerCollegeOrClub && !preDraftImageError ? (
                            <div className="player-pre-draft-container">
                                <img 
                                    className="player-college-or-club"
                                    src={`/pre-draft-teams/${playerPreDraft}.svg`}
                                    alt={playerCollegeOrClub ?? "Unknown"}
                                />
                                <span className="player-pre-draft-tooltip">
                                    {playerCollegeOrClub}
                                </span>
                            </div>
                        ) : (
                            playerCollegeOrClub && (
                                <span className="player-pre-draft-text">
                                    {playerCollegeOrClub}
                                </span>
                            )
                        )}
                    </div>
                </div>
                
                {/* Player Headshot */}
                <div className="player-headshot-wrapper">
                    <img
                        className="player-headshot"
                        src={headshotSrc}
                        alt={playerName ?? "headshot"}
                    />
                </div>
                {/* Unassign Button */}
                {!readOnly && (
                    <div className="unassign-button-container">
                        <button className="unassign-button" onClick={(e) => { e.stopPropagation(); onUnassign(); }}>
                            x
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
};

export default RedraftedPickCard;