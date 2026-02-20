import "./PlacedPickCard.css";
import React, { useState } from "react";

type PlacedPickCardProps = {
    pickNumber: number | null;
    playerName: string | null;
    draftedBy: string | null;
    tradedTo: string | null;
}

function PlacedPickCard({
    pickNumber,
    playerName,
    draftedBy,
    tradedTo,
}: PlacedPickCardProps) {
    const displayTeam = tradedTo ?? draftedBy ?? "NBA";
    const abbr = displayTeam.toLowerCase();
    const style: React.CSSProperties = {
        background: `linear-gradient(
            90deg,
            var(--${abbr}-grad-start),
            var(--${abbr}-grad-end)
        )`,
    }
    const badgeStyle: React.CSSProperties = {
        '--ring-color': `var(--${abbr}-grad-end)`,
    } as React.CSSProperties;

    return (
        <div className="placed-card" style={style}>
            <div className="placed-card-content">
                <div className="selection-number" style={badgeStyle}>
                    {pickNumber === null ? "UDFA" : `#${pickNumber}`}
                </div>
                <div className="team-logos-container">
                    <img
                        className="primary-logo"
                        src={`/src/assets/teams/${abbr}.svg`}
                        alt={abbr}
                    />
                    {tradedTo && draftedBy && (
                        <img
                            className="secondary-logo"
                            src={`/src/assets/teams/${draftedBy}.svg`}
                            alt={draftedBy}
                        />
                    )}
                </div>
                <span className="player-name">
                    {playerName ?? "Unknown"}
                </span>
            </div>
        </div>
    )
}

export default PlacedPickCard;