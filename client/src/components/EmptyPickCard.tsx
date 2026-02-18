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
            <div className="selection-number">
                #{pickNumber}
            </div>
        </div>
    )
};

export default EmptyPickCard;