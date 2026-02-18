import "./EmptyPickCard.css";
import React, { useState } from "react";

type EmptyPickCardProps = {
    pickNumber: number | null;
    selectionTeam: string | null;
}

function EmptyPickCard({
    pickNumber,
    selectionTeam,
}: EmptyPickCardProps) {
    const abbr = selectionTeam?.toLowerCase() ?? "nba";
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
        <div className="empty-card" style={style}>
            <div className="empty-card-content">
                <div className="selection-number" style={badgeStyle}>
                    #{pickNumber}
                </div>
                <div className="drafting-team-logo">
                    <img 
                        src={`/src/assets/teams/${abbr}.svg`} 
                        alt={abbr}                     
                        />
                </div>
            </div>
        </div>
    )
};

export default EmptyPickCard;