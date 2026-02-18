import "./EmptyPickCard.css";
import React, { useState } from "react";

type EmptyPickCardProps = {
    pickNumber: number | null;
    selectionTeam: string | null;
    assignedPlayer: { name: string; position: string | null; nbaStatsId: number | null } | null;
    isSelectionActive: boolean;
    onClick: () => void;
}

function EmptyPickCard({
    pickNumber,
    selectionTeam,
    assignedPlayer,
    isSelectionActive,
    onClick,
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
        <div
            className={`empty-card${assignedPlayer ? " has-player" : ""}${isSelectionActive && !assignedPlayer ? " droppable" : ""}`}
            style={style}
            onClick={onClick}
        >
            <div className="empty-card-content">
                <div className="selection-number" style={badgeStyle}>
                    #{pickNumber}
                </div>
                {assignedPlayer ? (
                    <div className="assigned-player">
                        <div className="assigned-player-info">
                            <span className="assigned-player-name">{assignedPlayer.name}</span>
                            {assignedPlayer.position && (
                                <span className="assigned-player-position">{assignedPlayer.position}</span>
                            )}
                        </div>
                        <img
                            className="assigned-player-headshot"
                            src={`https://cdn.nba.com/headshots/nba/latest/1040x760/${assignedPlayer.nbaStatsId ?? 0}.png`}
                            alt={assignedPlayer.name}
                        />
                    </div>
                ) : (
                    <div className="drafting-team-logo">
                        <img
                            src={`/src/assets/teams/${abbr}.svg`}
                            alt={abbr}
                        />
                    </div>
                )}
            </div>
        </div>
    )
};

export default EmptyPickCard;